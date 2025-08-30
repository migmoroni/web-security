import { SecurityAnalysisResult, SecurityIssue } from '@/types';
import { UnicodeAnalyzer } from './UnicodeAnalyzer';
import { AnalyzerRegistry, createDomainReputationAnalyzer, createPhishingAnalyzer } from './AnalyzerRegistry';

export class SecurityAnalyzer {
  private static initialized = false;

  private static initialize() {
    if (this.initialized) return;
    
    // Registrar analisadores disponíveis
    AnalyzerRegistry.register(createDomainReputationAnalyzer());
    AnalyzerRegistry.register(createPhishingAnalyzer());
    
    this.initialized = true;
  }

  static async analyzeUrl(url: string): Promise<SecurityAnalysisResult> {
    this.initialize();
    
    const issues: SecurityIssue[] = [];
    
    // Análise Unicode (integrada diretamente)
    const unicodeAnalysis = UnicodeAnalyzer.analyzeText(url);
    
    if (unicodeAnalysis.hasMixedScripts || unicodeAnalysis.suspiciousChars.length > 0) {
      const explanation = UnicodeAnalyzer.generateSuspicionExplanation(unicodeAnalysis);
      
      issues.push({
        type: 'unicode-spoofing',
        severity: unicodeAnalysis.suspiciousChars.length > 0 ? 'high' : 'medium',
        description: 'Possível spoofing de domínio detectado',
        details: explanation
      });
    }

    // Executar todos os analisadores registrados
    const registryIssues = await AnalyzerRegistry.runAllAnalyzers(url);
    issues.push(...registryIssues);

    // Determinar nível de suspeição geral
    const suspicionLevel = this.calculateSuspicionLevel(issues);
    const isSuspicious = issues.length > 0;

    return {
      isSuspicious,
      suspicionLevel,
      issues,
      url,
      timestamp: Date.now()
    };
  }

  private static calculateSuspicionLevel(issues: SecurityIssue[]): 'low' | 'medium' | 'high' {
    if (issues.length === 0) return 'low';
    
    const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
    const mediumSeverityIssues = issues.filter(issue => issue.severity === 'medium');
    
    if (highSeverityIssues.length > 0) return 'high';
    if (mediumSeverityIssues.length > 0) return 'medium';
    return 'low';
  }

  static registerAnalyzer(name: string, analyzer: (url: string) => Promise<SecurityIssue[]>) {
    // Funcionalidade para registrar novos analisadores no futuro
    console.log(`Registering analyzer: ${name}`);
  }
}
