import { SecurityIssue } from '../types';
import { ThreatIntelligenceService } from '../services/ThreatIntelligenceService';
import { DomainUtils } from '../utils/DomainUtils';

export class ExternalThreatAnalyzer {
  private static retryCount = 2;
  private static timeoutMs = 5000; // 5 segundos timeout

  /**
   * Analisa URL usando PhishTank e VirusTotal
   */
  async analyze(url: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const mainDomain = DomainUtils.extractMainDomain(url);
    
    // Se não é um domínio válido, pular verificação externa
    if (!DomainUtils.isValidDomain(mainDomain)) {
      return issues;
    }

    try {
      // Verificar conectividade das APIs
      const connectivity = await ThreatIntelligenceService.testConnectivity();
      
      if (!connectivity.phishTank && !connectivity.virusTotal) {
        issues.push({
          type: 'api-unavailable',
          severity: 'low',
          description: 'APIs de verificação externa indisponíveis',
          details: 'PhishTank e VirusTotal não puderam ser consultados. Verificação limitada aos analisadores locais.'
        });
        return issues;
      }

      // Verificar contra bases externas
      const threatResult = await this.checkWithTimeout(url);
      
      if (threatResult.isPhishing || threatResult.isMalicious) {
        issues.push(...threatResult.issues);
      }

      // Adicionar informações de verificação bem-sucedida
      if (issues.length === 0) {
        issues.push({
          type: 'external-verification',
          severity: 'info' as any,
          description: 'URL verificada em bases externas',
          details: `Verificado no PhishTank: ${connectivity.phishTank ? 'Sim' : 'Não'}, VirusTotal: ${connectivity.virusTotal ? 'Sim' : 'Não'}. Nenhuma ameaça detectada.`
        });
      }

    } catch (error) {
      console.warn('Erro na verificação externa:', error);
      issues.push({
        type: 'verification-error',
        severity: 'low',
        description: 'Erro na verificação externa',
        details: 'Não foi possível verificar completamente com APIs externas. Confiando em análise local.'
      });
    }

    return issues;
  }

  /**
   * Verifica URL com timeout para evitar travamento
   */
  private async checkWithTimeout(url: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout na verificação externa'));
      }, ExternalThreatAnalyzer.timeoutMs);

      try {
        const result = await ThreatIntelligenceService.checkUrl(url);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Verifica se uma URL específica é conhecida como maliciosa
   */
  static async isKnownMalicious(url: string): Promise<boolean> {
    try {
      const result = await ThreatIntelligenceService.checkUrl(url);
      return result.isPhishing || result.isMalicious;
    } catch {
      return false;
    }
  }

  /**
   * Obtém detalhes completos de ameaça
   */
  static async getThreatDetails(url: string): Promise<{
    phishTank?: any;
    virusTotal?: any;
    summary: string;
  }> {
    try {
      const result = await ThreatIntelligenceService.checkUrl(url);
      
      let summary = '';
      if (result.isPhishing && result.phishTankData) {
        summary += `PhishTank: Reportado como phishing (ID: ${result.phishTankData.phish_id}). `;
      }
      
      if (result.isMalicious && result.virusTotalData) {
        summary += `VirusTotal: ${result.virusTotalData.positives}/${result.virusTotalData.total} engines detectaram ameaça.`;
      }
      
      if (!summary) {
        summary = 'Nenhuma ameaça detectada nas bases externas.';
      }

      return {
        phishTank: result.phishTankData,
        virusTotal: result.virusTotalData,
        summary
      };
    } catch (error) {
      return {
        summary: 'Erro ao consultar bases externas.'
      };
    }
  }
}
