import { AnalysisConfig, StorageData, HistoryEntry, DesignConfig } from '@/types';

export class StorageService {
  private static readonly STORAGE_KEYS = {
    CONFIG: 'security-config',
    HISTORY: 'analysis-history',
    DESIGN: 'design-config'
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

  static async getAnalysisHistory(): Promise<HistoryEntry[]> {
    const result = await chrome.storage.local.get(this.STORAGE_KEYS.HISTORY);
    return result[this.STORAGE_KEYS.HISTORY] || [];
  }

  static async addAnalysisToHistory(entry: HistoryEntry): Promise<void> {
    const history = await this.getAnalysisHistory();
    
    // Adicionar nova entrada
    history.unshift(entry);
    
    // Manter apenas os últimos 30 dias
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(item => item.timestamp > thirtyDaysAgo);
    
    // Limitar a 1000 entradas para performance
    const trimmedHistory = filteredHistory.slice(0, 1000);
    
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.HISTORY]: trimmedHistory
    });
  }

  static async clearHistory(): Promise<void> {
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.HISTORY]: []
    });
  }

  static async getHistoryStats(): Promise<{
    total: number;
    safe: number;
    suspicious: number;
    dangerous: number;
    lastWeek: number;
  }> {
    const history = await this.getAnalysisHistory();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    return {
      total: history.length,
      safe: history.filter(h => h.analysis.type === 1).length,
      suspicious: history.filter(h => h.analysis.type === 2).length,
      dangerous: history.filter(h => h.analysis.type === 3).length,
      lastWeek: history.filter(h => h.timestamp > oneWeekAgo).length
    };
  }

  static async getDesignConfig(): Promise<DesignConfig> {
    const result = await chrome.storage.sync.get(this.STORAGE_KEYS.DESIGN);
    return result[this.STORAGE_KEYS.DESIGN] || this.getDefaultConfig().design;
  }

  static async saveDesignConfig(designConfig: DesignConfig): Promise<void> {
    await chrome.storage.sync.set({
      [this.STORAGE_KEYS.DESIGN]: designConfig
    });
  }

  private static getDefaultConfig(): AnalysisConfig {
    return {
      enabled: true,
      unicodeAnalysis: true,
      blockSuspiciousLinks: true,
      showWarnings: true,
      linkTypes: {
        text: {
          enabled: true,
          showBackground: true,
          showBorder: true,
          showIcon: false,
          borderStyle: 'solid',
          borderWidth: '3px',
          opacity: 0.1
        },
        image: {
          enabled: true,
          showBackground: false,
          showBorder: true,
          showIcon: false,
          borderStyle: 'solid',
          borderWidth: '3px',
          opacity: 0.1
        },
        video: {
          enabled: true,
          showBackground: false,
          showBorder: true,
          showIcon: true,
          borderStyle: 'dashed',
          borderWidth: '2px',
          opacity: 0.1
        },
        audio: {
          enabled: true,
          showBackground: false,
          showBorder: true,
          showIcon: true,
          borderStyle: 'dotted',
          borderWidth: '2px',
          opacity: 0.1
        },
        document: {
          enabled: true,
          showBackground: true,
          showBorder: true,
          showIcon: true,
          borderStyle: 'solid',
          borderWidth: '2px',
          opacity: 0.15
        },
        archive: {
          enabled: true,
          showBackground: true,
          showBorder: true,
          showIcon: true,
          borderStyle: 'double',
          borderWidth: '3px',
          opacity: 0.2
        },
        code: {
          enabled: true,
          showBackground: true,
          showBorder: true,
          showIcon: true,
          borderStyle: 'dashed',
          borderWidth: '1px',
          opacity: 0.1
        },
        service: {
          enabled: true,
          showBackground: false,
          showBorder: true,
          showIcon: true,
          borderStyle: 'solid',
          borderWidth: '2px',
          opacity: 0.1
        },
        download: {
          enabled: true,
          showBackground: true,
          showBorder: true,
          showIcon: true,
          borderStyle: 'solid',
          borderWidth: '4px',
          opacity: 0.25
        }
      },
      design: {
        theme: 'light',
        colorScheme: 'default',
        visualIndicators: {
          enabled: true,
          showSafeLinks: true,
          colors: {
            safe: '#dcfce7',      // Verde claro
            suspicious: '#fef3c7', // Amarelo claro  
            dangerous: '#fee2e2'   // Vermelho claro
          },
          style: {
            backgroundOpacity: 1.0,
            textContrast: true
          }
        },
        accessibility: {
          reduceMotion: false,
          highContrast: false,
          largeText: false,
          keyboardNavigation: true
        }
      }
    };
  }
}
