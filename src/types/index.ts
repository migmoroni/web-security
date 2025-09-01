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
  // Configurações visuais movidas para design
  design: DesignConfig;
}

export interface DesignConfig {
  theme: 'light' | 'dark' | 'auto';
  colorScheme: 'default' | 'colorblind' | 'highContrast' | 'subtle' | 'custom';
  visualIndicators: VisualIndicatorConfig;
  accessibility: AccessibilityConfig;
}

export interface AccessibilityConfig {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
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

export interface HistoryEntry {
  id: string;
  url: string;
  domain: string;
  analysis: SecurityAnalysisResult;
  timestamp: number;
  source: 'click' | 'navigation' | 'form' | 'popup';
  userAction?: 'blocked' | 'proceeded' | 'ignored';
}

export interface StorageData {
  config: AnalysisConfig;
  analysisHistory: SecurityAnalysisResult[];
}
