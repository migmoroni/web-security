import { SecurityAnalyzer } from '@/analyzers';
import { StorageService } from '@/services';
import { NavigationInterceptor } from '@/utils/NavigationInterceptor';
import { LinkVisualAnalyzer } from '@/services/LinkVisualAnalyzer';

// Inicializar serviços
NavigationInterceptor.initialize();
LinkVisualAnalyzer.initialize();

// Interceptar cliques em links
document.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;
  const link = target.closest('a');
  
  if (!link || !link.href) return;

  // Verificar se a análise está habilitada
  const config = await StorageService.getConfig();
  if (!config.enabled) return;

  // Evitar analisar links internos da mesma página
  const currentDomain = window.location.hostname;
  const linkUrl = new URL(link.href);
  
  if (linkUrl.hostname === currentDomain) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  try {
    // Analisar o link
    const analysis = await SecurityAnalyzer.analyzeUrl(link.href);
    
    if (analysis.isSuspicious) {
      // Enviar resultado para o background script para mostrar o warning
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
      // Se não há suspeitas, abrir o link normalmente
      if (event.ctrlKey || event.metaKey) {
        window.open(link.href, '_blank');
      } else {
        window.location.href = link.href;
      }
    }

    // Salvar no histórico
    const historyEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: link.href,
      domain: new URL(link.href).hostname,
      analysis,
      timestamp: Date.now(),
      source: 'click' as const,
      userAction: analysis.isSuspicious ? 'blocked' as const : undefined
    };
    await StorageService.addAnalysisToHistory(historyEntry);
    
  } catch (error) {
    console.error('Erro na análise de segurança:', error);
    // Em caso de erro, permitir navegação normal
    if (event.ctrlKey || event.metaKey) {
      window.open(link.href, '_blank');
    } else {
      window.location.href = link.href;
    }
  }
}, true); // useCapture = true para interceptar antes de outros handlers

// Limpar navegações interceptadas quando página for fechada
window.addEventListener('beforeunload', () => {
  NavigationInterceptor.cleanup();
});

// Escutar mensagens do background/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_VISUAL_CONFIG') {
    LinkVisualAnalyzer.updateConfig(message.data);
  } else if (message.type === 'UPDATE_DESIGN_CONFIG') {
    // Atualizar configuração visual com os dados do design
    if (message.data.visualIndicators) {
      LinkVisualAnalyzer.updateConfig(message.data.visualIndicators);
    }
  }
});
