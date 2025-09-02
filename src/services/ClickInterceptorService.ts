import { LexicalAnalyzer } from '@/analyzers/LexicalAnalyzer';
import { ReputationAnalyzer } from '@/analyzers/ReputationAnalyzer';
import { UrlAnalysisResult, AnalysisDetails } from '@/types';
import { StorageService } from '@/services/StorageService';

/**
 * PARTE 2.2: SERVIÇO DE INTERCEPTAÇÃO DE CLIQUES
 * Programa que ao clicar em links, captura a ação, não permite carregar página ainda
 * e envia para análise do link, fazendo as duas análises (léxica e reputação)
 */
export class ClickInterceptorService {
  private static processedLinks = new WeakSet<HTMLAnchorElement>();
  private static observer?: MutationObserver;
  private static isEnabled = true;
  private static initialized = false;

  /**
   * Inicializa o serviço de interceptação
   */
  static async initialize() {
    if (this.initialized) return;
    
    console.log('🎯 Inicializando ClickInterceptorService...');
    
    // Verificar se serviço está habilitado
    const config = await StorageService.getConfig();
    this.isEnabled = config.enabled;
    
    if (!this.isEnabled) {
      console.log('⏸️ ClickInterceptorService desabilitado por configuração');
      return;
    }

    // Configurar interceptação de cliques
    this.setupClickInterception();
    
    this.initialized = true;
    console.log('✅ ClickInterceptorService operacional');
  }

  /**
   * Configura a interceptação de cliques em links
   */
  private static setupClickInterception() {
    document.addEventListener('click', async (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      // Verificar se é um link válido
      if (!link || !link.href) return;
      
      // Verificar se é URL externa
      if (!this.isExternalUrl(link.href)) return;

      // INTERCEPTAR A AÇÃO - não permite carregar ainda
      event.preventDefault();
      event.stopImmediatePropagation();

      console.log('🔗 Clique interceptado em:', link.href);

      try {
        // Fazer análise completa (léxica + reputação)
        const analysis = await this.performCompleteAnalysis(link.href);
        
        // Salvar no histórico
        await this.saveToHistory(link.href, analysis, 'click');
        
        // Decidir ação baseada no tipo
        if (analysis.type === 2 || analysis.type === 3) {
          // Enviar para serviço de alerta
          chrome.runtime.sendMessage({
            type: 'SHOW_SECURITY_WARNING',
            data: {
              analysis,
              originalEvent: {
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey
              }
            }
          });
        } else {
          // Tipo 1 - não suspeito, permitir navegação normal
          this.allowNavigation(link.href, event);
        }
        
      } catch (error) {
        console.error('Erro na análise do link:', error);
        // Em caso de erro, permitir navegação normal
        this.allowNavigation(link.href, event);
      }
    }, true); // useCapture = true para interceptar antes de outros handlers
  }

  /**
   * Verifica se URL é externa
   */
  private static isExternalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const currentDomain = window.location.hostname;
      
      return (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && 
             urlObj.hostname !== currentDomain;
    } catch {
      return false;
    }
  }

  /**
   * Realiza análise completa da URL (léxica + reputação)
   */
  private static async performCompleteAnalysis(url: string): Promise<UrlAnalysisResult> {
    console.log('🧪 Analisando URL:', url);
    
    const details: AnalysisDetails = {};
    
    // 1. Análise léxica (sempre feita)
    const lexicalResult = LexicalAnalyzer.analyzeUrl(url);
    details.lexical = lexicalResult;
    
    // 2. Análise de reputação (só se necessário)
    const reputationResult = await ReputationAnalyzer.analyzeUrl(url);
    details.reputation = reputationResult;
    
    // Determinar tipo final (considerando o tipo de perigo mais alto)
    let finalType: 1 | 2 | 3 = 1; // Padrão: não suspeito
    
    // Se reputação indica perigo, é tipo 3
    if (reputationResult.isDangerous) {
      finalType = 3;
    }
    // Se não há perigo de reputação, mas há problemas léxicos, é tipo 2
    else if (lexicalResult.hasMixedScripts || lexicalResult.suspiciousChars.length > 0) {
      finalType = 2;
    }
    
    console.log(`📋 Análise concluída - Tipo: ${finalType}`);
    
    return {
      type: finalType,
      url,
      timestamp: Date.now(),
      details
    };
  }

  /**
   * Permite navegação normal
   */
  private static allowNavigation(url: string, originalEvent: MouseEvent) {
    if (originalEvent.ctrlKey || originalEvent.metaKey) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  }

  /**
   * Salva análise no histórico
   */
  private static async saveToHistory(url: string, analysis: UrlAnalysisResult, source: string) {
    try {
      const historyEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        domain: new URL(url).hostname,
        analysis,
        timestamp: Date.now(),
        source: source as 'click',
        userAction: analysis.type > 1 ? 'blocked' as const : undefined
      };
      
      await StorageService.addAnalysisToHistory(historyEntry);
      console.log('💾 Análise salva no histórico');
    } catch (error) {
      console.warn('Erro ao salvar no histórico:', error);
    }
  }

  /**
   * Atualiza configuração do serviço
   */
  static async updateConfig(newConfig: any) {
    this.isEnabled = newConfig.enabled;
    
    if (!this.isEnabled) {
      this.disable();
    } else if (!this.initialized) {
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
    
    this.initialized = false;
    console.log('⏸️ ClickInterceptorService desabilitado');
  }
}
