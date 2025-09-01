import { SecurityAnalyzer } from '@/analyzers';
import { DomainUtils } from '@/utils/DomainUtils';

/**
 * Interceptor de formulários de pesquisa e barra de endereços
 */
export class NavigationInterceptor {
  private static interceptedUrls = new Set<string>();

  /**
   * Inicializa interceptação de formulários
   */
  static initialize() {
    this.interceptForms();
    this.interceptAddressBar();
    this.interceptPopups();
  }

  /**
   * Intercepta envios de formulários que podem conter URLs suspeitas
   */
  private static interceptForms() {
    document.addEventListener('submit', async (event) => {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      
      // Procurar por campos que podem conter URLs
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          const potentialUrl = this.extractUrlFromInput(value);
          if (potentialUrl && await this.shouldBlock(potentialUrl)) {
            event.preventDefault();
            this.showNavigationWarning(potentialUrl, 'form-submission');
            return;
          }
        }
      }
    });
  }

  /**
   * Intercepta mudanças na barra de endereços (limitado pelas APIs do browser)
   */
  private static interceptAddressBar() {
    // Monitorar mudanças no histórico (pushState, replaceState)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(state, title, url) {
      if (url && typeof url === 'string') {
        NavigationInterceptor.checkNavigationUrl(url);
      }
      return originalPushState.apply(history, arguments);
    };
    
    history.replaceState = function(state, title, url) {
      if (url && typeof url === 'string') {
        NavigationInterceptor.checkNavigationUrl(url);
      }
      return originalReplaceState.apply(history, arguments);
    };

    // Monitorar evento popstate
    window.addEventListener('popstate', (event) => {
      const url = window.location.href;
      this.checkNavigationUrl(url);
    });
  }

  /**
   * Intercepta aberturas de popup/janelas
   */
  private static interceptPopups() {
    const originalWindowOpen = window.open;
    
    window.open = function(url, target, features) {
      if (url && typeof url === 'string') {
        NavigationInterceptor.checkNavigationUrl(url).then(shouldBlock => {
          if (!shouldBlock) {
            originalWindowOpen.call(window, url, target, features);
          }
        });
        return null; // Bloquear abertura até verificação
      }
      return originalWindowOpen.apply(window, arguments);
    };
  }

  /**
   * Verifica se uma URL deve ser bloqueada
   */
  private static async shouldBlock(url: string): Promise<boolean> {
    if (!url || this.interceptedUrls.has(url)) return false;
    
    try {
      const mainDomain = DomainUtils.extractMainDomain(url);
      
      // Não bloquear se for domínio interno ou conhecido como seguro
      if (mainDomain === window.location.hostname || DomainUtils.isKnownDomain(mainDomain)) {
        return false;
      }

      const analysis = await SecurityAnalyzer.analyzeUrl(url);
      return analysis.isSuspicious;
    } catch {
      return false;
    }
  }

  /**
   * Verifica URL de navegação
   */
  private static async checkNavigationUrl(url: string): Promise<boolean> {
    const shouldBlock = await this.shouldBlock(url);
    if (shouldBlock) {
      this.showNavigationWarning(url, 'navigation');
    }
    return shouldBlock;
  }

  /**
   * Extrai URLs de inputs de texto
   */
  private static extractUrlFromInput(input: string): string | null {
    // Regex para detectar URLs em texto
    const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const matches = input.match(urlRegex);
    
    if (matches && matches.length > 0) {
      let url = matches[0];
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      return url;
    }
    
    return null;
  }

  /**
   * Mostra aviso de navegação bloqueada
   */
  private static showNavigationWarning(url: string, source: string) {
    this.interceptedUrls.add(url);
    
    // Enviar para background script
    chrome.runtime.sendMessage({
      type: 'NAVIGATION_BLOCKED',
      data: {
        url,
        source,
        timestamp: Date.now()
      }
    });
    
    // Opcional: mostrar notificação inline
    this.showInlineWarning(url, source);
  }

  /**
   * Mostra aviso inline na página
   */
  private static showInlineWarning(url: string, source: string) {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    
    warningDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">🛡️ Navegação Bloqueada</div>
      <div style="font-size: 12px; opacity: 0.9;">URL suspeita detectada via ${source}</div>
      <div style="margin-top: 10px;">
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
          Fechar
        </button>
      </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    // Auto-remover após 10 segundos
    setTimeout(() => {
      if (warningDiv.parentElement) {
        warningDiv.remove();
      }
    }, 10000);
  }

  /**
   * Limpa URLs interceptadas (para evitar vazamento de memória)
   */
  static cleanup() {
    this.interceptedUrls.clear();
  }
}
