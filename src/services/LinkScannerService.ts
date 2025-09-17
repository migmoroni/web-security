import { LexicalAnalyzer } from '@/analyzers/LexicalAnalyzer';
import { UrlAnalysisResult, LinkTypeConfig } from '@/types';
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
   * Varre links existentes na página, incluindo Shadow DOM.
   */
  private static scanExistingLinks() {
    console.log('🔍 Varrendo links existentes na página...');
    this.scanNodeAndShadows(document.body);
  }

  /**
   * Configura observer para detectar novos links, incluindo em Shadow DOM.
   */
  private static setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          this.scanNodeAndShadows(node);
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Varre um nó e seus descendentes, incluindo Shadow DOM, em busca de links.
   */
  private static scanNodeAndShadows(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // 1. Processa o próprio elemento se for um link
      if (element.tagName === 'A' && element.hasAttribute('href')) {
        this.processLink(element as HTMLAnchorElement);
      }

      // 2. Processa links dentro do elemento
      const links = element.querySelectorAll('a[href]');
      links.forEach(link => this.processLink(link as HTMLAnchorElement));

      // 3. Se o elemento tiver um Shadow Root, varre-o recursivamente
      if (element.shadowRoot) {
        this.scanNodeAndShadows(element.shadowRoot);
      }

      // 4. Varre todos os descendentes do elemento atual
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
      while(walker.nextNode()) {
        const currentNode = walker.currentNode as Element;
        if (currentNode.shadowRoot) {
          this.scanNodeAndShadows(currentNode.shadowRoot);
        }
      }
    }
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
      await this.applyVisualIndicator(link, analysisType);
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
   * Verifica se o link aponta para mídia ou arquivo
   */
  private static isMediaLink(link: HTMLAnchorElement): boolean {
    // Verificar se o link contém elementos de mídia como filhos diretos
    const hasMediaChild = link.querySelector('img, video, audio, canvas') !== null;
    
    // Extensões de diferentes tipos de mídia e arquivos
    const mediaExtensions = {
      images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif'],
      videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'],
      audio: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.wma', '.m4a', '.opus'],
      documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt'],
      archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
      code: ['.js', '.css', '.html', '.xml', '.json', '.csv']
    };
    
    // Combinar todas as extensões
    const allExtensions = [
      ...mediaExtensions.images,
      ...mediaExtensions.videos,
      ...mediaExtensions.audio,
      ...mediaExtensions.documents,
      ...mediaExtensions.archives,
      ...mediaExtensions.code
    ];
    
    // Verificar se a URL termina com extensão de mídia/arquivo
    const url = link.href.toLowerCase();
    const urlWithoutQuery = url.split('?')[0].split('#')[0]; // Remove query parameters e fragments
    const hasMediaExtension = allExtensions.some(ext => urlWithoutQuery.endsWith(ext));
    
    // Verificar se o link tem apenas mídia como conteúdo (sem texto significativo)
    const textContent = link.textContent?.trim() || '';
    const onlyMediaContent = hasMediaChild && (textContent === '' || textContent.length < 3);
    
    // Verificar atributos que indicam download
    const hasDownloadAttribute = link.hasAttribute('download');
    
    // Verificar se o link aponta para serviços de mídia conhecidos (YouTube, etc.)
    const mediaServicePatterns = [
      /youtube\.com\/watch/,
      /youtu\.be\//,
      /vimeo\.com\//,
      /soundcloud\.com\//,
      /spotify\.com\//,
      /imgur\.com\//,
      /flickr\.com\//,
      /drive\.google\.com\/file/,
      /dropbox\.com\/s\//,
      /onedrive\.live\.com/
    ];
    
    const isMediaService = mediaServicePatterns.some(pattern => pattern.test(url));
    
    return hasMediaChild || hasMediaExtension || onlyMediaContent || hasDownloadAttribute || isMediaService;
  }

  /**
   * Identifica o tipo de link para configuração
   */
  private static getLinkType(link: HTMLAnchorElement): keyof LinkTypeConfig {
    const url = link.href.toLowerCase();
    const urlWithoutQuery = url.split('?')[0].split('#')[0];
    
    // Verificar elementos de mídia como filhos
    if (link.querySelector('img')) return 'image';
    if (link.querySelector('video')) return 'video';
    if (link.querySelector('audio')) return 'audio';
    
    // Verificar por extensão
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif'];
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.wma', '.m4a', '.opus'];
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt'];
    const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'];
    const codeExts = ['.js', '.css', '.html', '.xml', '.json', '.csv'];
    
    if (imageExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'image';
    if (videoExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'video';
    if (audioExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'audio';
    if (docExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'document';
    if (archiveExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'archive';
    if (codeExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'code';
    
    // Verificar serviços de mídia
    if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'service';
    if (/vimeo\.com\//.test(url)) return 'service';
    if (/soundcloud\.com\//.test(url)) return 'service';
    if (/spotify\.com\//.test(url)) return 'service';
    if (/imgur\.com\/|flickr\.com\//.test(url)) return 'service';
    if (/drive\.google\.com\/file|dropbox\.com\/s\/|onedrive\.live\.com/.test(url)) return 'service';
    
    // Verificar atributo download
    if (link.hasAttribute('download')) return 'download';
    
    return 'text';
  }

  /**
   * Identifica o tipo específico de mídia para logs
   */
  private static getMediaType(link: HTMLAnchorElement): string {
    const url = link.href.toLowerCase();
    const urlWithoutQuery = url.split('?')[0].split('#')[0];
    
    // Verificar elementos de mídia como filhos
    if (link.querySelector('img')) return 'imagem';
    if (link.querySelector('video')) return 'vídeo';
    if (link.querySelector('audio')) return 'áudio';
    if (link.querySelector('canvas')) return 'canvas';
    
    // Verificar por extensão
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif'];
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'];
    const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.wma', '.m4a', '.opus'];
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt'];
    const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'];
    const codeExts = ['.js', '.css', '.html', '.xml', '.json', '.csv'];
    
    if (imageExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'imagem';
    if (videoExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'vídeo';
    if (audioExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'áudio';
    if (docExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'documento';
    if (archiveExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'arquivo';
    if (codeExts.some(ext => urlWithoutQuery.endsWith(ext))) return 'código';
    
    // Verificar serviços de mídia
    if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'vídeo (YouTube)';
    if (/vimeo\.com\//.test(url)) return 'vídeo (Vimeo)';
    if (/soundcloud\.com\//.test(url)) return 'áudio (SoundCloud)';
    if (/spotify\.com\//.test(url)) return 'áudio (Spotify)';
    if (/imgur\.com\/|flickr\.com\//.test(url)) return 'imagem (serviço)';
    if (/drive\.google\.com\/file|dropbox\.com\/s\/|onedrive\.live\.com/.test(url)) return 'arquivo (nuvem)';
    
    // Verificar atributo download
    if (link.hasAttribute('download')) return 'download';
    
    return 'mídia/arquivo';
  }

  /**
   * Aplica indicador visual ao link
   */
  private static async applyVisualIndicator(link: HTMLAnchorElement, type: 1 | 2) {
    // Remover indicadores anteriores
    link.classList.remove('security-link-type-1', 'security-link-type-2');
    
    // Adicionar novo indicador
    link.classList.add(`security-link-type-${type}`);
    
    // Adicionar título explicativo de forma idempotente
    const titles = {
      1: 'Link analisado - Não suspeito',
      2: 'Link suspeito - Clique com cuidado'
    };
    const newTitleMessage = titles[type];
    let originalTitle = link.getAttribute('title') || '';

    // Lista de possíveis prefixos de status
    const statusPrefixes = [
      'Link analisado - Não suspeito | ',
      'Link suspeito - Clique com cuidado | '
    ];

    // Remover qualquer prefixo de status antigo do título
    for (const prefix of statusPrefixes) {
      if (originalTitle.startsWith(prefix)) {
        originalTitle = originalTitle.substring(prefix.length);
      }
    }
    
    // Definir o novo título com o status correto
    link.title = `${newTitleMessage} | ${originalTitle || link.href}`;
    
    // Aplicar estilos CSS
    await this.applyLinkStyles(link, type);
  }

  /**
   * Aplica estilos CSS aos links
   */
  private static async applyLinkStyles(link: HTMLAnchorElement, type: 1 | 2) {
    // Obter configuração atual
    const config = await StorageService.getConfig();
    
    // Identificar tipo de link
    const linkType = this.getLinkType(link);
    const linkConfig = config.linkTypes?.[linkType];
    
    if (!linkConfig || !linkConfig.enabled) {
      console.log(`🚫 Configuração para tipo "${linkType}" desabilitada ou não encontrada`);
      return;
    }
    
    console.log(`� Aplicando estilo para link tipo "${linkType}" com configuração:`, linkConfig);
    
    // Cores padrão baseadas no tipo de análise
    const defaultColors = {
      1: '#22c55e', // Verde para links seguros
      2: '#fbbf24'  // Amarelo para links suspeitos
    };
    
    // Usar cores personalizadas se configuradas
    const colors = linkConfig.customColors || {
      safe: defaultColors[1],
      suspicious: defaultColors[2],
      dangerous: '#ef4444'
    };
    
    const color = type === 1 ? colors.safe : colors.suspicious;
    
    // Aplicar estilos baseados na configuração
    const styles: any = {
      borderRadius: '2px',
      transition: 'all 0.2s ease'
    };
    
    // Background (se habilitado)
    if (linkConfig.showBackground) {
      const opacity = linkConfig.opacity || 0.1;
      const rgb = this.hexToRgb(color);
      if (rgb) {
        styles.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      }
    } else {
      styles.backgroundColor = 'transparent';
    }
    
    // Border (se habilitado)  
    if (linkConfig.showBorder) {
      const borderWidth = linkConfig.borderWidth || '3px';
      const borderStyle = linkConfig.borderStyle || 'solid';
      styles.borderLeft = `${borderWidth} ${borderStyle} ${color}`;
      styles.paddingLeft = '4px';
    }
    
    // Icon (se habilitado - implementação futura)
    if (linkConfig.showIcon) {
      // TODO: Implementar ícones para diferentes tipos de links
    }
    
    Object.assign(link.style, styles);
  }
  
  /**
   * Converte cor hexadecimal para RGB
   */
  private static hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
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
