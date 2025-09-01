import { SecurityAnalysisResult } from '@/types';
import { SecurityAnalyzer } from '@/analyzers';
import { NavigationMonitorService } from '@/services/NavigationMonitorService';

interface SecurityWarningMessage {
  type: 'SHOW_SECURITY_WARNING';
  data: {
    analysis: SecurityAnalysisResult;
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

interface AllowNavigationMessage {
  type: 'ALLOW_NAVIGATION';
  data: {
    url: string;
    tabId: number;
  };
}

type Message = SecurityWarningMessage | UserDecisionMessage | NavigationBlockedMessage | AllowNavigationMessage;

// Inicializar serviço de monitoramento de navegação
NavigationMonitorService.initialize();

// Escutar mensagens do content script e páginas
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Só interceptar navegação principal (não frames)
  if (details.frameId !== 0) return;

  try {
    console.log('🔍 Interceptando navegação para:', details.url);
    
    // Analisar URL antes da navegação
    const analysis = await SecurityAnalyzer.analyzeUrl(details.url);
    
    if (analysis.isSuspicious) {
      console.log('🚨 URL suspeita detectada na navegação:', details.url);
      
      // Redirecionar para página de bloqueio
      const blockedUrl = chrome.runtime.getURL('blocked.html') + 
                        `?url=${encodeURIComponent(details.url)}&analysis=${encodeURIComponent(JSON.stringify(analysis))}`;
      
      chrome.tabs.update(details.tabId, { url: blockedUrl });
    }
  } catch (error) {
    console.error('Erro na análise de navegação:', error);
    // Em caso de erro, permitir navegação normal
  }
});

// Escutar mensagens do content script e páginas
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === 'SHOW_SECURITY_WARNING') {
    showSecurityWarning(message.data);
  } else if (message.type === 'USER_DECISION') {
    handleUserDecision(message.data);
  } else if (message.type === 'NAVIGATION_BLOCKED') {
    console.log('📊 Navegação bloqueada registrada:', message.data);
  } else if (message.type === 'ALLOW_NAVIGATION') {
    NavigationMonitorService.allowNavigation(message.data.url, message.data.tabId);
  }
});

function showSecurityWarning(data: SecurityWarningMessage['data']) {
  // Criar uma janela de aviso modal usando chrome.windows
  chrome.windows.create({
    url: chrome.runtime.getURL('popup/warning.html') + 
         `?data=${encodeURIComponent(JSON.stringify(data))}`,
    type: 'popup',
    width: 500,
    height: 400,
    focused: true
  });
}

function handleUserDecision(data: UserDecisionMessage['data']) {
  if (data.proceed) {
    if (data.openInNewTab) {
      chrome.tabs.create({ url: data.url });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.update(tabs[0].id, { url: data.url });
        }
      });
    }
  }
  
  // Fechar a janela de aviso
  chrome.windows.getCurrent((window) => {
    if (window.id) {
      chrome.windows.remove(window.id);
    }
  });
}

// Configurar ícone da extensão baseado no status
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateBadge(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateBadge(tabId);
  }
});

async function updateBadge(tabId: number) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return;

    const analysis = await import('@/analyzers').then(({ SecurityAnalyzer }) => 
      SecurityAnalyzer.analyzeUrl(tab.url!)
    );

    if (analysis.isSuspicious) {
      chrome.action.setBadgeText({ text: '⚠', tabId });
      chrome.action.setBadgeBackgroundColor({ 
        color: analysis.suspicionLevel === 'high' ? '#ef4444' : '#f59e0b',
        tabId 
      });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch (error) {
    console.error('Erro ao atualizar badge:', error);
  }
}
