import { AnalysisConfig, StorageData } from '@/types';

export class StorageService {
  private static readonly STORAGE_KEYS = {
    CONFIG: 'security-config',
    HISTORY: 'analysis-history'
  };

  static async getConfig(): Promise<AnalysisConfig> {
    const result = await chrome.storage.sync.get(this.STORAGE_KEYS.CONFIG);
    return result[this.STORAGE_KEYS.CONFIG] || this.getDefaultConfig();
  }

  static async setConfig(config: AnalysisConfig): Promise<void> {
    await chrome.storage.sync.set({
      [this.STORAGE_KEYS.CONFIG]: config
    });
  }

  static async getAnalysisHistory(): Promise<any[]> {
    const result = await chrome.storage.local.get(this.STORAGE_KEYS.HISTORY);
    return result[this.STORAGE_KEYS.HISTORY] || [];
  }

  static async addAnalysisToHistory(analysis: any): Promise<void> {
    const history = await this.getAnalysisHistory();
    history.unshift(analysis);
    
    // Manter apenas os últimos 100 registros
    const trimmedHistory = history.slice(0, 100);
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.HISTORY]: trimmedHistory
    });
  }

  private static getDefaultConfig(): AnalysisConfig {
    return {
      enabled: true,
      unicodeAnalysis: true,
      blockSuspiciousLinks: true,
      showWarnings: true,
      visualIndicators: {
        enabled: true,
        showSafeLinks: true,
        colors: {
          safe: '#10b981',      // Verde
          suspicious: '#f59e0b', // Amarelo/laranja  
          dangerous: '#ef4444'   // Vermelho
        },
        borderStyle: {
          width: 2,
          style: 'solid'
        }
      }
    };
  }
}
