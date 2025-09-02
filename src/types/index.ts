// Tipos simplificados para a nova estrutura
export interface UrlAnalysisResult {
  type: 1 | 2 | 3; // 1: não suspeito, 2: suspeito, 3: perigoso
  url: string;
  timestamp: number;
  details: AnalysisDetails;
}

export interface AnalysisDetails {
  lexical?: LexicalAnalysisResult;
  reputation?: ReputationAnalysisResult;
}

export interface LexicalAnalysisResult {
  hasMixedScripts: boolean;
  scripts: string[];
  suspiciousChars: SuspiciousCharacter[];
  explanation: string;
}

export interface ReputationAnalysisResult {
  isDangerous: boolean;
  sources: string[];
  details: string;
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
  style: {
    backgroundOpacity: number;
    textContrast: boolean;
  };
}

export interface HistoryEntry {
  id: string;
  url: string;
  domain: string;
  analysis: UrlAnalysisResult;
  timestamp: number;
  source: 'click' | 'navigation' | 'form' | 'popup';
  userAction?: 'blocked' | 'proceeded' | 'ignored';
}

export interface StorageData {
  config: AnalysisConfig;
  analysisHistory: UrlAnalysisResult[];
}
