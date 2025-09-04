import { LexicalAnalyzer } from '@/analyzers/LexicalAnalyzer';
import { UrlAnalysisResult } from '@/types';
import { StorageService } from '@/services/StorageService';


/**
 * PARTE 2.1: SERVIÇO DE VARREDURA DE LINKS
 * Programa que varre páginas à procura de links e hiperlinks (http ou https)
 * Marca links para usuário saber que é um link
 * Solicita apenas análise léxica, retornando se é URL do tipo 2 para avisar usuário
 */
export class LinkScannerService {
  private static processedLinks = new WeakSet<HTMLAnchorElement>();
  private static observer?: MutationObserver;
  private static isEnabled = true;

  /**
   * Inicializa o serviço de varredura
   */
  static async initialize() {
    console.log('🔍 Inicializando LinkScannerService...');
    
    // Verificar se serviço está habilitado
    const config = await StorageService.getConfig();
    console.log('📋 Configuração carregada:', config);
    this.isEnabled = config.enabled;
    
    if (!this.isEnabled) {
      console.log('⏸️ LinkScannerService desabilitado por configuração');
      return;
    }

    console.log('✅ LinkScannerService habilitado, iniciando varredura...');
    
    // Varrer links existentes
    this.scanExistingLinks();
    
    // Observar novos links
    this.setupMutationObserver();
    
    console.log('🔍 LinkScannerService iniciado com sucesso');
  }

  /**
   * Varre links existentes na página
   */
  private static scanExistingLinks() {
    const links = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
    console.log(`🔍 Encontrados ${links.length} links na página`);
    
    links.forEach((link, index) => {
      console.log(`📎 Link ${index + 1}: ${link.href}`);
      this.processLink(link);
    });
    
    console.log(`📊 ${links.length} links processados na página inicial`);
  }

  /**
   * Configura observer para detectar novos links
   */
  private static setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Verificar se o próprio elemento é um link
            if (element.tagName === 'A' && element.hasAttribute('href')) {
              this.processLink(element as HTMLAnchorElement);
            }
            
            // Verificar links dentro do elemento adicionado
            const links = element.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
            links.forEach(link => this.processLink(link));
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
    
    // Evitar processar o mesmo link múltiplas vezes
    if (this.processedLinks.has(link)) return;
    this.processedLinks.add(link);

    // Verificar se é URL externa (http/https)
    if (!this.isExternalUrl(link.href)) return;

    console.log(`🔗 Processando link: ${link.href}`);

    try {
      // Fazer apenas análise léxica (rápida)
      const lexicalResult = LexicalAnalyzer.analyzeUrl(link.href);
      console.log(`📊 Resultado da análise:`, lexicalResult);
      
      // Determinar tipo baseado na análise léxica
      const analysisType: 1 | 2 = (lexicalResult.hasMixedScripts || lexicalResult.suspiciousChars.length > 0) ? 2 : 1;
      console.log(`🎯 Tipo determinado: ${analysisType}`);
      
      // Aplicar indicador visual
      this.applyVisualIndicator(link, analysisType);
      console.log(`🎨 Indicador visual aplicado para tipo ${analysisType}`);
      
      // Log apenas para links suspeitos
      if (analysisType === 2) {
        console.log(`⚠️ Link suspeito detectado: ${link.href} - ${lexicalResult.explanation}`);
      }
      
    } catch (error) {
      console.warn('Erro ao processar link:', link.href, error);
    }
  }

  /**
   * Verifica se URL é externa (http/https)
   */
  private static isExternalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const isExternal = (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && 
             urlObj.hostname !== window.location.hostname;
      console.log(`🌐 URL ${url} é externa? ${isExternal} (protocolo: ${urlObj.protocol}, hostname: ${urlObj.hostname} vs ${window.location.hostname})`);
      return isExternal;
    } catch (error) {
      console.log(`❌ Erro ao verificar URL ${url}:`, error);
      return false;
    }
  }

  /**
   * Aplica indicador visual ao link
   */
  private static applyVisualIndicator(link: HTMLAnchorElement, type: 1 | 2) {
    // Remover indicadores anteriores
    link.classList.remove('security-link-type-1', 'security-link-type-2');
    
    // Adicionar novo indicador
    link.classList.add(`security-link-type-${type}`);
    
    // Adicionar título explicativo
    const titles = {
      1: 'Link analisado - Não suspeito',
      2: 'Link suspeito - Clique com cuidado'
    };
    
    link.title = `${titles[type]} | ${link.title || link.href}`;
    
    // Aplicar estilos CSS
    this.applyLinkStyles(link, type);
  }

  /**
   * Aplica estilos CSS aos links
   */
  private static applyLinkStyles(link: HTMLAnchorElement, type: 1 | 2) {
    const styles = {
      1: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)', // Verde claro transparente
        borderLeft: '3px solid #22c55e',
        paddingLeft: '4px'
      },
      2: {
        backgroundColor: 'rgba(251, 191, 36, 0.2)', // Amarelo claro transparente
        borderLeft: '3px solid #fbbf24',
        paddingLeft: '4px'
      }
    };

    const style = styles[type];
    
    Object.assign(link.style, {
      backgroundColor: style.backgroundColor,
      borderLeft: style.borderLeft,
      paddingLeft: style.paddingLeft,
      borderRadius: '2px',
      transition: 'all 0.2s ease'
    });
  }

  /**
   * Atualiza configuração do serviço
   */
  static async updateConfig(newConfig: any) {
    this.isEnabled = newConfig.enabled;
    
    if (!this.isEnabled) {
      this.disable();
    } else {
      this.initialize();
    }
  }

  /**
   * Desabilita o serviço
   */
  private static disable() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    
    // Remover indicadores visuais existentes
    const links = document.querySelectorAll('a.security-link-type-1, a.security-link-type-2');
    links.forEach(link => {
      link.classList.remove('security-link-type-1', 'security-link-type-2');
      (link as HTMLElement).style.backgroundColor = '';
      (link as HTMLElement).style.borderLeft = '';
      (link as HTMLElement).style.paddingLeft = '';
    });
    
    console.log('⏸️ LinkScannerService desabilitado');
  }
}
