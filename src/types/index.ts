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
}

export interface StorageData {
  config: AnalysisConfig;
  analysisHistory: SecurityAnalysisResult[];
}
