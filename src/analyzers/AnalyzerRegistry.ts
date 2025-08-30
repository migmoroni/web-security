import { SecurityIssue } from '@/types';

export interface AnalyzerModule {
  name: string;
  version: string;
  analyze: (url: string) => Promise<SecurityIssue[]>;
  isEnabled: () => Promise<boolean>;
}

export class AnalyzerRegistry {
  private static analyzers: Map<string, AnalyzerModule> = new Map();

  static register(analyzer: AnalyzerModule) {
    this.analyzers.set(analyzer.name, analyzer);
    console.log(`📋 Analisador registrado: ${analyzer.name} v${analyzer.version}`);
  }

  static async runAllAnalyzers(url: string): Promise<SecurityIssue[]> {
    const allIssues: SecurityIssue[] = [];

    for (const [name, analyzer] of this.analyzers) {
      try {
        const isEnabled = await analyzer.isEnabled();
        if (!isEnabled) continue;

        const issues = await analyzer.analyze(url);
        allIssues.push(...issues);
      } catch (error) {
        console.error(`Erro no analisador ${name}:`, error);
      }
    }

    return allIssues;
  }

  static getRegisteredAnalyzers(): string[] {
    return Array.from(this.analyzers.keys());
  }

  static getAnalyzer(name: string): AnalyzerModule | undefined {
    return this.analyzers.get(name);
  }
}

// Exemplo de como registrar novos analisadores
export const createDomainReputationAnalyzer = (): AnalyzerModule => ({
  name: 'domain-reputation',
  version: '1.0.0',
  analyze: async (url: string): Promise<SecurityIssue[]> => {
    // Placeholder para análise de reputação de domínio
    // No futuro, pode integrar com APIs de segurança
    const issues: SecurityIssue[] = [];
    
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Lista básica de domínios suspeitos (expandir conforme necessário)
    const suspiciousDomains = [
      'bit.ly',
      'tinyurl.com',
      't.co'
    ];

    if (suspiciousDomains.some(domain => hostname.includes(domain))) {
      issues.push({
        type: 'shortened-url',
        severity: 'medium',
        description: 'URL encurtada detectada',
        details: 'URLs encurtadas podem ocultar o destino real e serem usadas em ataques de phishing.'
      });
    }

    return issues;
  },
  isEnabled: async (): Promise<boolean> => {
    // Verificar configurações do usuário
    return true; // Por ora, sempre habilitado
  }
});

export const createPhishingAnalyzer = (): AnalyzerModule => ({
  name: 'phishing-detection',
  version: '1.0.0',
  analyze: async (url: string): Promise<SecurityIssue[]> => {
    const issues: SecurityIssue[] = [];
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Detectar domínios que imitam serviços populares
    const legitimateDomains = [
      'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
      'apple.com', 'paypal.com', 'netflix.com', 'instagram.com',
      'twitter.com', 'linkedin.com', 'youtube.com'
    ];

    for (const domain of legitimateDomains) {
      if (hostname !== domain && hostname.includes(domain.replace('.com', ''))) {
        issues.push({
          type: 'domain-imitation',
          severity: 'high',
          description: `Possível imitação de ${domain}`,
          details: `O domínio ${hostname} pode estar tentando imitar o site legítimo ${domain}.`
        });
      }
    }

    return issues;
  },
  isEnabled: async (): Promise<boolean> => true
});
