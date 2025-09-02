import { UrlAnalysisResult } from '@/types';

/**
 * PARTE 1: INICIALIZADOR
 * Garante que todos os recursos da extensão estejam funcionando e operantes
 * Mantém a extensão alerta, operando em segundo plano
 */

interface SecurityWarningMessage {
  type: 'SHOW_SECURITY_WARNING';
  data: {
    analysis: UrlAnalysisResult;
    originalEvent: {
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
    };
  };
}

interface UserDecisionMessage {
  type: 'USER_DECISION';
  data: {
    proceed: boolean;
    url: string;
    openInNewTab: boolean;
  };
}

interface NavigationBlockedMessage {
  type: 'NAVIGATION_BLOCKED';
  data: {
    url: string;
    source: string;
    timestamp: number;
  };
}

class ExtensionInitializer {
  private static initialized = false;

  /**
   * Inicializa todos os recursos da extensão
   */
  static async initialize() {
    if (this.initialized) return;

    console.log('🚀 Inicializando Web Security Analyzer...');

    // Garantir que os serviços estejam operacionais
    this.setupMessageHandlers();
    this.setupTabHandlers();
    
    // Verificar se content scripts estão carregados
    await this.ensureContentScriptsLoaded();
    
    this.initialized = true;
    console.log('✅ Extensão inicializada e operante');
  }

  /**
   * Configura handlers de mensagens entre scripts
   */
  private static setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'SHOW_SECURITY_WARNING':
          this.handleSecurityWarning(message as SecurityWarningMessage, sender);
          break;
        case 'USER_DECISION':
          this.handleUserDecision(message as UserDecisionMessage);
          break;
        case 'NAVIGATION_BLOCKED':
          this.handleNavigationBlocked(message as NavigationBlockedMessage);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Configura handlers de abas
   */
  private static setupTabHandlers() {
    // Monitor quando novas abas são criadas
    chrome.tabs.onCreated.addListener((tab) => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        console.log(`📄 Nova aba criada: ${tab.url}`);
      }
    });

    // Monitor quando abas são atualizadas
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
        console.log(`🔄 Aba atualizada: ${tab.url}`);
      }
    });
  }

  /**
   * Garante que content scripts estejam carregados em todas as abas
   */
  private static async ensureContentScriptsLoaded() {
    try {
      const tabs = await chrome.tabs.query({ active: true });
      
      for (const tab of tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content/index.js']
            });
          } catch (error) {
            // Script já carregado ou erro de permissão - ignorar
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar content scripts:', error);
    }
  }

  /**
   * Processa alerta de segurança
   */
  private static async handleSecurityWarning(message: SecurityWarningMessage, sender: chrome.runtime.MessageSender) {
    const { analysis, originalEvent } = message.data;
    
    if (analysis.type === 2 || analysis.type === 3) {
      // Bloquear navegação e mostrar alerta
      if (sender.tab?.id) {
        await this.showSecurityWarning(sender.tab.id, analysis, originalEvent);
      }
    }
  }

  /**
   * Processa decisão do usuário
   */
  private static async handleUserDecision(message: UserDecisionMessage) {
    const { proceed, url, openInNewTab } = message.data;
    
    if (proceed) {
      if (openInNewTab) {
        await chrome.tabs.create({ url });
      } else {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          await chrome.tabs.update(tabs[0].id, { url });
        }
      }
    }
  }

  /**
   * Registra navegação bloqueada
   */
  private static handleNavigationBlocked(message: NavigationBlockedMessage) {
    console.log(`🚫 Navegação bloqueada: ${message.data.url} (${message.data.source})`);
  }

  /**
   * Mostra alerta de segurança
   */
  private static async showSecurityWarning(tabId: number, analysis: UrlAnalysisResult, originalEvent: any) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (analysisData: UrlAnalysisResult, eventData: any) => {
          // Injetar alerta na página
          (window as any).showSecurityWarning?.(analysisData, eventData);
        },
        args: [analysis, originalEvent]
      });
    } catch (error) {
      console.error('Erro ao mostrar alerta de segurança:', error);
    }
  }
}

// Inicializar quando extension for carregada
chrome.runtime.onStartup.addListener(() => {
  ExtensionInitializer.initialize();
});

chrome.runtime.onInstalled.addListener(() => {
  ExtensionInitializer.initialize();
});

// Inicializar imediatamente
ExtensionInitializer.initialize();
