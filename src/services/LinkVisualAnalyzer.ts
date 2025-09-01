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
    try {
      const designConfig = await StorageService.getDesignConfig();
      this.config = designConfig.visualIndicators;
    } catch (error) {
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * Configuração padrão para indicadores visuais
   */
  private static getDefaultConfig(): VisualIndicatorConfig {
    return {
      enabled: true,
      showSafeLinks: true,
      colors: {
        safe: '#dcfce7',      // Verde claro
        suspicious: '#fef3c7', // Amarelo claro
        dangerous: '#fee2e2'   // Vermelho claro
      },
      style: {
        backgroundOpacity: 0.3,
        textContrast: true
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
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Processar links adicionados
            const links = element.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
            links.forEach(link => this.processLink(link));
            
            // Se o próprio nó é um link
            if (element.tagName === 'A' && (element as HTMLAnchorElement).href) {
              this.processLink(element as HTMLAnchorElement);
            }
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
    if (this.processedLinks.has(link) || !link.href) return;
    
    this.processedLinks.add(link);
    
    try {
      const url = new URL(link.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      
      const analysis = await SecurityAnalyzer.analyzeUrl(link.href);
      this.applyVisualIndicator(link, analysis.isSuspicious, analysis.suspicionLevel);
      this.addTooltip(link, analysis);
      
    } catch (error) {
      console.warn('Erro ao processar link:', error);
    }
  }

  /**
   * Aplica indicador visual no link usando background
   */
  private static applyVisualIndicator(
    link: HTMLAnchorElement, 
    isSuspicious: boolean, 
    suspicionLevel: 'low' | 'medium' | 'high'
  ) {
    if (!this.config) return;

    const { colors, style } = this.config;
    
    // Determinar cor baseada no nível de suspeita
    let color: string;
    let securityLevel: string;
    
    if (!isSuspicious) {
      if (!this.config.showSafeLinks) return;
      color = colors.safe;
      securityLevel = 'safe';
    } else {
      color = suspicionLevel === 'high' ? colors.dangerous : colors.suspicious;
      securityLevel = suspicionLevel === 'high' ? 'dangerous' : 'suspicious';
    }

    // Salvar background original
    const originalBackground = link.style.backgroundColor;
    link.setAttribute('data-original-bg', originalBackground || '');
    
    // Aplicar background colorido
    link.style.backgroundColor = color;
    link.style.transition = 'background-color 0.3s ease';
    
    // Melhorar contraste do texto se configurado
    if (style.textContrast) {
      link.style.fontWeight = '500';
      link.style.textShadow = '1px 1px 1px rgba(0,0,0,0.3)';
    }
    
    // Adicionar atributo para referência
    link.setAttribute('data-security-level', securityLevel);
    
    // Efeito hover - escurecer ligeiramente
    const originalColor = color;
    link.addEventListener('mouseenter', () => {
      const darkerColor = this.darkenColor(originalColor, 0.1);
      link.style.backgroundColor = darkerColor;
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.backgroundColor = originalColor;
    });
  }

  /**
   * Escurece uma cor hexadecimal
   */
  private static darkenColor(hex: string, amount: number): string {
    // Remove # se presente
    hex = hex.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Escurece cada componente
    const newR = Math.max(0, Math.round(r * (1 - amount)));
    const newG = Math.max(0, Math.round(g * (1 - amount)));
    const newB = Math.max(0, Math.round(b * (1 - amount)));
    
    // Converte de volta para hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Adiciona tooltip informativo
   */
  private static addTooltip(link: HTMLAnchorElement, analysis: any) {
    const status = analysis.isSuspicious ? 
      `⚠️ Suspeito (${analysis.suspicionLevel})` : 
      '✅ Seguro';
    
    const issues = analysis.issues?.map((issue: any) => issue.description).join(', ') || '';
    const tooltipText = `${status}${issues ? ` - ${issues}` : ''}`;
    
    link.setAttribute('title', tooltipText);
  }

  /**
   * Atualiza configuração visual
   */
  static async updateConfig(newConfig: VisualIndicatorConfig) {
    this.config = newConfig;
    this.reapplyStyles();
  }

  /**
   * Reaplicar estilos em links existentes
   */
  private static reapplyStyles() {
    const links = document.querySelectorAll('a[data-security-level]') as NodeListOf<HTMLAnchorElement>;
    
    links.forEach(link => {
      // Restaurar background original
      const originalBg = link.getAttribute('data-original-bg') || '';
      link.style.backgroundColor = originalBg;
      link.style.fontWeight = '';
      link.style.textShadow = '';
      
      // Remover atributos
      link.removeAttribute('data-security-level');
      link.removeAttribute('data-original-bg');
      
      // Remarcar para reprocessamento
      this.processedLinks.delete(link);
    });
    
    // Reprocessar todos os links
    this.analyzeExistingLinks();
  }

  /**
   * Desabilita análise visual
   */
  static disable() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    
    // Remover todos os indicadores visuais
    const links = document.querySelectorAll('a[data-security-level]') as NodeListOf<HTMLAnchorElement>;
    links.forEach(link => {
      const originalBg = link.getAttribute('data-original-bg') || '';
      link.style.backgroundColor = originalBg;
      link.style.fontWeight = '';
      link.style.textShadow = '';
      link.removeAttribute('data-security-level');
      link.removeAttribute('data-original-bg');
      link.removeAttribute('title');
    });
    
    this.processedLinks = new WeakSet();
  }

  /**
   * Obtém estatísticas de links processados
   */
  static getStats() {
    const links = document.querySelectorAll('a[data-security-level]');
    const safe = document.querySelectorAll('a[data-security-level="safe"]').length;
    const suspicious = document.querySelectorAll('a[data-security-level="suspicious"]').length;
    const dangerous = document.querySelectorAll('a[data-security-level="dangerous"]').length;
    
    return {
      total: links.length,
      safe,
      suspicious,
      dangerous
    };
  }
}
