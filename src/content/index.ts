import { SecurityAnalyzer } from '@/analyzers';
import { StorageService } from '@/services';
import { NavigationInterceptor } from '@/utils/NavigationInterceptor';

// Inicializar interceptação de navegação para formulários e JS
NavigationInterceptor.initialize();

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
    await StorageService.addAnalysisToHistory(analysis);
    
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

// Adicionar indicadores visuais para links suspeitos (opcional)
function addVisualIndicators() {
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(async (link) => {
    const href = (link as HTMLAnchorElement).href;
    if (!href) return;

    try {
      const analysis = await SecurityAnalyzer.analyzeUrl(href);
      
      if (analysis.isSuspicious) {
        const linkElement = link as HTMLAnchorElement;
        linkElement.setAttribute('data-security-warning', analysis.suspicionLevel);
        linkElement.style.borderBottom = `2px solid ${
          analysis.suspicionLevel === 'high' ? '#ef4444' : 
          analysis.suspicionLevel === 'medium' ? '#f59e0b' : '#10b981'
        }`;
      }
    } catch (error) {
      // Falha silenciosa para não interferir na experiência do usuário
    }
  });
}

// Executar análise visual quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addVisualIndicators);
} else {
  addVisualIndicators();
}

// Re-analisar quando conteúdo dinâmico for adicionado
const observer = new MutationObserver(() => {
  addVisualIndicators();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
