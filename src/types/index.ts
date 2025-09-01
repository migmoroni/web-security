export interface SecurityAnalysisResult {
  isSuspicious: boolean;
  suspicionLevel: 'low' | 'medium' | 'high';
  issues: SecurityIssue[];
  url: string;
  timestamp: number;
}

export interface SecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  details: string;
}

// Novos tipos para análise aprimorada
export interface AnalysisResult {
  safe: boolean;
  threats: SecurityThreat[];
  score: number;
  analysis: {
    domain: string;
    checkedAgainst: string[];
    timestamp: string;
  };
}

export interface SecurityThreat {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  details: any;
}

export interface UnicodeAnalysisResult {
  hasMixedScripts: boolean;
  scripts: string[];
  suspiciousChars: SuspiciousCharacter[];
}

export interface SuspiciousCharacter {
  char: string;
  script: string;
  position: number;
  context: string;
}

export interface AnalysisConfig {
  enabled: boolean;
  unicodeAnalysis: boolean;
  blockSuspiciousLinks: boolean;
  showWarnings: boolean;
  // Novas configurações visuais
  visualIndicators: VisualIndicatorConfig;
}

export interface VisualIndicatorConfig {
  enabled: boolean;
  showSafeLinks: boolean;
  colors: {
    safe: string;
    suspicious: string;
    dangerous: string;
  };
  borderStyle: {
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
}

export interface StorageData {
  config: AnalysisConfig;
  analysisHistory: SecurityAnalysisResult[];
}
