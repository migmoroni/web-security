import { SecurityIssue } from '../types';
import { DEFAULT_API_CONFIG, KNOWN_SAFE_DOMAINS, SAFE_TLDS } from '../config/api-config';

// Tentar importar chaves de API, usar valores padrão se não existir
let API_KEYS: { phishTank: string; virusTotal: string };
try {
  API_KEYS = require('../config/api-keys').API_KEYS;
} catch {
  // Usar chaves de exemplo se arquivo não existir
  API_KEYS = {
    phishTank: 'YOUR_PHISHTANK_KEY_HERE',
    virusTotal: 'YOUR_VIRUSTOTAL_KEY_HERE'
  };
}

export interface PhishTankResult {
  url: string;
  phish_id?: string;
  phish_detail_url?: string;
  verified?: boolean;
  verified_time?: string;
  online?: boolean;
  details?: string;
}

export interface VirusTotalResult {
  scans: { [engine: string]: { detected: boolean; result: string } };
  positives: number;
  total: number;
  scan_date: string;
  permalink: string;
  verbose_msg: string;
}

export interface ThreatIntelligenceResult {
  isPhishing: boolean;
  isMalicious: boolean;
  phishTankData?: PhishTankResult;
  virusTotalData?: VirusTotalResult;
  issues: SecurityIssue[];
}

export class ThreatIntelligenceService {
  private static readonly config = DEFAULT_API_CONFIG;
  
  // Configuração de cache para evitar consultas repetitivas
  private static cache = new Map<string, ThreatIntelligenceResult>();
  private static cacheExpiry = 15 * 60 * 1000; // 15 minutos

  /**
   * Verifica um URL contra PhishTank e VirusTotal
   */
  static async checkUrl(url: string): Promise<ThreatIntelligenceResult> {
    const cacheKey = this.normalizeUrl(url);
    
    // Verificar se é domínio conhecido como seguro
    if (this.isKnownSafeDomain(cacheKey)) {
      return {
        isPhishing: false,
        isMalicious: false,
        issues: [{
          type: 'known-safe',
          severity: 'info' as any,
          description: 'Domínio reconhecido como seguro',
          details: 'Este domínio está na whitelist local de sites conhecidos como seguros.'
        }]
      };
    }
    
    // Verificar cache primeiro
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    const result: ThreatIntelligenceResult = {
      isPhishing: false,
      isMalicious: false,
      issues: []
    };

    try {
      // Verificar PhishTank primeiro (mais rápido)
      const phishTankResult = await this.checkPhishTank(url);
      if (phishTankResult) {
        result.isPhishing = true;
        result.phishTankData = phishTankResult;
        result.issues.push({
          type: 'phishtank-detected',
          severity: 'high',
          description: 'URL identificada como phishing pelo PhishTank',
          details: `Phishing verificado: ${phishTankResult.verified ? 'Sim' : 'Não'}. ${phishTankResult.details || 'Site reportado como fraudulento'}`
        });
      }

      // Verificar VirusTotal
      const virusTotalResult = await this.checkVirusTotal(url);
      if (virusTotalResult && virusTotalResult.positives > 0) {
        result.isMalicious = true;
        result.virusTotalData = virusTotalResult;
        result.issues.push({
          type: 'virustotal-detected',
          severity: virusTotalResult.positives > 5 ? 'high' : 'medium',
          description: `Detectado por ${virusTotalResult.positives}/${virusTotalResult.total} engines do VirusTotal`,
          details: `Detecções: ${virusTotalResult.positives}/${virusTotalResult.total}. Escaneado em: ${virusTotalResult.scan_date}. Detalhes: ${virusTotalResult.permalink}`
        });
      }

    } catch (error) {
      console.warn('Erro ao consultar APIs de threat intelligence:', error);
      // Em caso de erro na API, continuar com análise local
      result.issues.push({
        type: 'api-error',
        severity: 'low',
        description: 'Não foi possível verificar em bases externas',
        details: 'Verificação limitada apenas aos analisadores locais'
      });
    }

    // Cachear resultado
    this.setCachedResult(cacheKey, result);
    
    return result;
  }

  /**
   * Verifica URL no PhishTank
   */
  private static async checkPhishTank(url: string): Promise<PhishTankResult | null> {
    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(`${this.config.phishTank.apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Web Security Analyzer Extension 1.0'
        },
        body: `url=${encodedUrl}&format=json&app_key=${API_KEYS.phishTank}`
      });

      if (!response.ok) {
        throw new Error(`PhishTank API error: ${response.status}`);
      }

      const data = await response.json();
      
      // PhishTank retorna resultado se encontrou o URL como phishing
      if (data.results && data.results.in_database) {
        return {
          url: data.results.url,
          phish_id: data.results.phish_id,
          phish_detail_url: data.results.phish_detail_url,
          verified: data.results.verified,
          verified_time: data.results.verified_time,
          online: data.results.online,
          details: data.results.details || 'Reportado como site de phishing'
        };
      }

      return null;
    } catch (error) {
      console.warn('Erro ao consultar PhishTank:', error);
      return null;
    }
  }

  /**
   * Verifica URL no VirusTotal
   */
  private static async checkVirusTotal(url: string): Promise<VirusTotalResult | null> {
    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(`${this.config.virusTotal.apiUrl}?apikey=${API_KEYS.virusTotal}&resource=${encodedUrl}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Web Security Analyzer Extension 1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`VirusTotal API error: ${response.status}`);
      }

      const data = await response.json();
      
      // VirusTotal retorna detecções
      if (data.response_code === 1) {
        return {
          scans: data.scans || {},
          positives: data.positives || 0,
          total: data.total || 0,
          scan_date: data.scan_date,
          permalink: data.permalink,
          verbose_msg: data.verbose_msg
        };
      }

      return null;
    } catch (error) {
      console.warn('Erro ao consultar VirusTotal:', error);
      return null;
    }
  }

  /**
   * Normaliza URL para cache
   */
  private static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * Verifica se é um domínio conhecido como seguro
   */
  private static isKnownSafeDomain(domain: string): boolean {
    const normalizedDomain = domain.toLowerCase();
    
    // Verificar whitelist direta
    if (KNOWN_SAFE_DOMAINS.includes(normalizedDomain)) {
      return true;
    }
    
    // Verificar TLDs seguros
    if (SAFE_TLDS.some(tld => normalizedDomain.endsWith(tld))) {
      return true;
    }
    
    // Verificar subdomínios de sites conhecidos
    return KNOWN_SAFE_DOMAINS.some(safeDomain => 
      normalizedDomain.endsWith(`.${safeDomain}`)
    );
  }

  /**
   * Verifica cache
   */
  private static getCachedResult(key: string): ThreatIntelligenceResult | null {
    const cached = this.cache.get(key);
    if (cached) {
      // Verificar se ainda está válido (15 minutos)
      const now = Date.now();
      if (cached.issues.length === 0 || 
          cached.issues.some(issue => issue.details && 
            now - new Date(issue.details.split('em: ')[1]?.split('.')[0] || 0).getTime() < this.cacheExpiry)) {
        return cached;
      }
      // Remover entrada expirada
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Salva no cache
   */
  private static setCachedResult(key: string, result: ThreatIntelligenceResult): void {
    // Limitar tamanho do cache
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }

  /**
   * Limpa cache manualmente
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Verifica se as APIs estão disponíveis
   */
  static async testConnectivity(): Promise<{ phishTank: boolean; virusTotal: boolean }> {
    const results = {
      phishTank: false,
      virusTotal: false
    };

    try {
      // Teste simples de conectividade com PhishTank
      const ptResponse = await fetch(this.config.phishTank.apiUrl, { method: 'HEAD' });
      results.phishTank = ptResponse.ok || ptResponse.status === 405; // 405 = Method Not Allowed é ok
    } catch {
      results.phishTank = false;
    }

    try {
      // Teste simples de conectividade com VirusTotal
      const vtResponse = await fetch(`${this.config.virusTotal.apiUrl}?apikey=test`, { method: 'HEAD' });
      results.virusTotal = vtResponse.ok || vtResponse.status === 403; // 403 = Forbidden é ok (API key inválida)
    } catch {
      results.virusTotal = false;
    }

    return results;
  }
}
