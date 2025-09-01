import { SecurityAnalyzer } from '@/analyzers';
import { StorageService } from '@/services';
import { VisualIndicatorConfig } from '@/types';

/**
 * Serviço para análise visual de links nas páginas
 */
export class LinkVisualAnalyzer {
  private static processedLinks = new WeakSet<HTMLAnchorElement>();
  private static observer?: MutationObserver;
  private static config?: VisualIndicatorConfig;

  /**
   * Inicializa a análise visual de links
   */
  static async initialize() {
    await this.loadConfig();
    
    if (!this.config?.enabled) return;

    this.analyzeExistingLinks();
    this.setupMutationObserver();
    
    console.log('🎨 LinkVisualAnalyzer inicializado');
  }

  /**
   * Carrega configuração visual
   */
  private static async loadConfig() {
    const storageConfig = await StorageService.getConfig();
    this.config = storageConfig.visualIndicators || this.getDefaultConfig();
  }

  /**
   * Configuração padrão para indicadores visuais
   */
  private static getDefaultConfig(): VisualIndicatorConfig {
    return {
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
    };
  }

  /**
   * Analisa links existentes na página
   */
  private static analyzeExistingLinks() {
    const links = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
    links.forEach(link => this.processLink(link));
  }

  /**
   * Configura observer para novos links
   */
  private static setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Verificar se o próprio nó é um link
            if (element.tagName === 'A') {
              this.processLink(element as HTMLAnchorElement);
            }
            
            // Verificar links filhos
            const childLinks = element.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
            childLinks.forEach(link => this.processLink(link));
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Processa um link individual
   */
  private static async processLink(link: HTMLAnchorElement) {
    if (!this.config?.enabled || this.processedLinks.has(link) || !link.href) {
      return;
    }

    this.processedLinks.add(link);

    try {
      // Evitar analisar links internos da mesma página
      const currentDomain = window.location.hostname;
      const linkUrl = new URL(link.href);
      
      if (linkUrl.hostname === currentDomain) return;

      // Analisar o link
      const analysis = await SecurityAnalyzer.analyzeUrl(link.href);
      
      this.applyVisualIndicator(link, analysis.isSuspicious, analysis.suspicionLevel);
      
      // Adicionar tooltip informativo
      this.addTooltip(link, analysis);
      
    } catch (error) {
      console.error('Erro na análise visual do link:', error);
    }
  }

  /**
   * Aplica indicador visual no link
   */
  private static applyVisualIndicator(
    link: HTMLAnchorElement, 
    isSuspicious: boolean, 
    suspicionLevel: 'low' | 'medium' | 'high'
  ) {
    if (!this.config) return;

    const { colors, borderStyle } = this.config;
    
    // Determinar cor baseada no nível de suspeita
    let color: string;
    if (!isSuspicious) {
      if (!this.config.showSafeLinks) return;
      color = colors.safe;
    } else {
      color = suspicionLevel === 'high' ? colors.dangerous : colors.suspicious;
    }

    // Aplicar estilo
    const borderValue = `${borderStyle.width}px ${borderStyle.style} ${color}`;
    link.style.borderBottom = borderValue;
    link.style.transition = 'border-color 0.3s ease';
    
    // Adicionar atributo para referência
    link.setAttribute('data-security-status', isSuspicious ? suspicionLevel : 'safe');
    
    // Efeito hover
    const originalBorder = borderValue;
    link.addEventListener('mouseenter', () => {
      link.style.borderBottom = `${borderStyle.width + 1}px ${borderStyle.style} ${color}`;
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.borderBottom = originalBorder;
    });
  }

  /**
   * Adiciona tooltip informativo
   */
  private static addTooltip(link: HTMLAnchorElement, analysis: any) {
    const status = analysis.isSuspicious ? 
      `⚠️ Suspeito (${analysis.suspicionLevel})` : 
      '✅ Seguro';
      
    const issueCount = analysis.issues?.length || 0;
    const tooltip = issueCount > 0 ? 
      `${status} - ${issueCount} problema(s) detectado(s)` : 
      status;
    
    link.title = `🛡️ Web Security: ${tooltip}`;
  }

  /**
   * Atualiza configuração visual
   */
  static async updateConfig(newConfig: VisualIndicatorConfig) {
    this.config = newConfig;
    
    // Salvar no storage
    const currentConfig = await StorageService.getConfig();
    currentConfig.visualIndicators = newConfig;
    await StorageService.setConfig(currentConfig);
    
    // Reaplicar estilos
    this.reapplyStyles();
  }

  /**
   * Reaplica estilos em todos os links
   */
  private static reapplyStyles() {
    // Limpar estilos existentes
    const styledLinks = document.querySelectorAll('a[data-security-status]') as NodeListOf<HTMLAnchorElement>;
    styledLinks.forEach(link => {
      link.style.borderBottom = '';
      link.removeAttribute('data-security-status');
      link.title = '';
    });

    // Limpar conjunto de links processados
    this.processedLinks = new WeakSet();
    
    // Reprocessar todos os links
    this.analyzeExistingLinks();
  }

  /**
   * Remove indicadores visuais
   */
  static disable() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }

    // Remover estilos de todos os links
    const styledLinks = document.querySelectorAll('a[data-security-status]') as NodeListOf<HTMLAnchorElement>;
    styledLinks.forEach(link => {
      link.style.borderBottom = '';
      link.removeAttribute('data-security-status');
      link.title = '';
    });
  }

  /**
   * Obtém estatísticas dos links analisados
   */
  static getStats() {
    const links = document.querySelectorAll('a[data-security-status]');
    const stats = {
      total: links.length,
      safe: 0,
      suspicious: 0,
      dangerous: 0
    };

    links.forEach(link => {
      const status = link.getAttribute('data-security-status');
      if (status === 'safe') stats.safe++;
      else if (status === 'low' || status === 'medium') stats.suspicious++;
      else if (status === 'high') stats.dangerous++;
    });

    return stats;
  }
}
