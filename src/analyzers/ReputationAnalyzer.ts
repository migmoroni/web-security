import { ReputationAnalysisResult } from '@/types';

/**
 * Analisador de Reputação de URLs
 * Analisa URLs através de listas do PhishTank e URLhaus para descobrir reputação
 */
export class ReputationAnalyzer {
  private static readonly PHISHTANK_API = 'https://checkurl.phishtank.com/checkurl/';
  private static readonly URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1/url/';

  /**
   * Analisa reputação da URL
   * Retorna tipo 3 (perigoso) se encontrado em listas de ameaças
   */
  static async analyzeUrl(url: string): Promise<ReputationAnalysisResult> {
    const sources: string[] = [];
    let isDangerous = false;
    let details = '';

    try {
      // Verificar PhishTank
      const phishTankResult = await this.checkPhishTank(url);
      if (phishTankResult.isDangerous) {
        isDangerous = true;
        sources.push('PhishTank');
        details += `PhishTank: ${phishTankResult.details}\n`;
      }

      // Verificar URLhaus apenas se PhishTank não detectou
      if (!isDangerous) {
        const urlhausResult = await this.checkUrlhaus(url);
        if (urlhausResult.isDangerous) {
          isDangerous = true;
          sources.push('URLhaus');
          details += `URLhaus: ${urlhausResult.details}\n`;
        }
      }

      if (!isDangerous) {
        details = 'URL não encontrada em listas de ameaças conhecidas.';
      }

    } catch (error) {
      console.warn('Erro na análise de reputação:', error);
      details = 'Não foi possível verificar a reputação da URL devido a erro de conectividade.';
    }

    return {
      isDangerous,
      sources,
      details: details.trim()
    };
  }

  /**
   * Verifica URL no PhishTank
   */
  private static async checkPhishTank(url: string): Promise<{ isDangerous: boolean; details: string }> {
    try {
      // Implementação simplificada - em produção usar API key real
      const response = await fetch(`${this.PHISHTANK_API}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(url)}&format=json`
      });

      if (!response.ok) {
        throw new Error(`PhishTank API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.in_database) {
        return {
          isDangerous: data.results.valid,
          details: `Phishing confirmado - ID: ${data.results.phish_id || 'N/A'}`
        };
      }

      return { isDangerous: false, details: 'Não encontrado no PhishTank' };
    } catch (error) {
      console.warn('Erro ao consultar PhishTank:', error);
      return { isDangerous: false, details: 'Erro na consulta PhishTank' };
    }
  }

  /**
   * Verifica URL no URLhaus
   */
  private static async checkUrlhaus(url: string): Promise<{ isDangerous: boolean; details: string }> {
    try {
      const response = await fetch(this.URLHAUS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(url)}`
      });

      if (!response.ok) {
        throw new Error(`URLhaus API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.query_status === 'ok') {
        return {
          isDangerous: true,
          details: `Malware detectado - Tags: ${data.tags?.join(', ') || 'N/A'}`
        };
      }

      return { isDangerous: false, details: 'Não encontrado no URLhaus' };
    } catch (error) {
      console.warn('Erro ao consultar URLhaus:', error);
      return { isDangerous: false, details: 'Erro na consulta URLhaus' };
    }
  }
}
