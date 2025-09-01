import { SecurityAnalyzer } from '@/analyzers';
import { DomainUtils } from '@/utils/DomainUtils';

/**
 * Serviço para interceptar navegação via background script
 * Este serviço tem acesso às APIs webNavigation para interceptar
 * URLs digitadas na barra de endereços
 */
export class NavigationMonitorService {
  private static blockedNavigations = new Set<string>();
  private static isInitialized = false;

  /**
   * Inicializa o serviço de monitoramento
   */
  static initialize() {
    if (this.isInitialized) return;
    
    this.setupNavigationListener();
    this.setupTabUpdateListener();
    this.isInitialized = true;
    console.log('🛡️ NavigationMonitorService inicializado');
  }

  /**
   * Configura listener para interceptar navegação
   */
  private static setupNavigationListener() {
    if (!chrome.webNavigation?.onBeforeNavigate) {
      console.warn('webNavigation API não disponível');
      return;
    }

    chrome.webNavigation.onBeforeNavigate.addListener(
      async (details) => {
        // Apenas interceptar navegação principal (não frames)
        if (details.frameId !== 0) return;
        
        // Evitar loop infinito
        if (this.blockedNavigations.has(details.url)) return;
        
        try {
          const shouldBlock = await this.shouldBlockNavigation(details.url);
          
          if (shouldBlock) {
            console.log('🚫 Navegação bloqueada:', details.url);
            this.blockedNavigations.add(details.url);
            
            // Redirecionar para página de bloqueio
            const blockedUrl = chrome.runtime.getURL('blocked.html') + 
              `?url=${encodeURIComponent(details.url)}&tabId=${details.tabId}`;
            
            chrome.tabs.update(details.tabId, { url: blockedUrl });
          }
        } catch (error) {
          console.error('Erro ao verificar navegação:', error);
        }
      },
      { url: [{ schemes: ['http', 'https'] }] }
    );
  }

  /**
   * Configura listener para mudanças em tabs
   */
  private static setupTabUpdateListener() {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.url) {
        // Verificar se é uma URL digitada na barra de endereços
        if (changeInfo.url !== tab.url) return;
        
        const shouldBlock = await this.shouldBlockNavigation(changeInfo.url);
        
        if (shouldBlock && !this.blockedNavigations.has(changeInfo.url)) {
          console.log('🚫 URL na barra de endereços bloqueada:', changeInfo.url);
          this.blockedNavigations.add(changeInfo.url);
          
          const blockedUrl = chrome.runtime.getURL('blocked.html') + 
            `?url=${encodeURIComponent(changeInfo.url)}&tabId=${tabId}`;
          
          chrome.tabs.update(tabId, { url: blockedUrl });
        }
      }
    });
  }

  /**
   * Verifica se uma navegação deve ser bloqueada
   */
  private static async shouldBlockNavigation(url: string): Promise<boolean> {
    try {
      // Não bloquear páginas internas da extensão
      if (url.startsWith(chrome.runtime.getURL(''))) return false;
      
      // Não bloquear URLs de desenvolvimento local
      if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
      
      // Verificar se é um domínio conhecido como seguro
      const mainDomain = DomainUtils.extractMainDomain(url);
      if (DomainUtils.isKnownDomain(mainDomain)) return false;
      
      // Analisar URL
      const analysis = await SecurityAnalyzer.analyzeUrl(url);
      
      return analysis.isSuspicious;
    } catch (error) {
      console.error('Erro na análise de navegação:', error);
      return false; // Em caso de erro, não bloquear
    }
  }

  /**
   * Permite uma URL específica (quando usuário escolhe prosseguir)
   */
  static allowNavigation(url: string, tabId: number) {
    this.blockedNavigations.delete(url);
    
    // Redirecionar para a URL original
    chrome.tabs.update(tabId, { url });
  }

  /**
   * Obtém estatísticas de navegação bloqueada
   */
  static getBlockedStats() {
    return {
      totalBlocked: this.blockedNavigations.size,
      blockedUrls: Array.from(this.blockedNavigations)
    };
  }

  /**
   * Limpa navegações bloqueadas (manutenção)
   */
  static cleanup() {
    this.blockedNavigations.clear();
  }

  /**
   * Remove URLs antigas da lista (chamado periodicamente)
   */
  static cleanupOldEntries() {
    // Por simplicidade, limpar tudo - em produção poderia ser mais inteligente
    if (this.blockedNavigations.size > 100) {
      this.blockedNavigations.clear();
    }
  }
}
