import { SecurityAnalysisResult } from '@/types';

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

type Message = SecurityWarningMessage | UserDecisionMessage;

// Escutar mensagens do content script
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === 'SHOW_SECURITY_WARNING') {
    showSecurityWarning(message.data);
  } else if (message.type === 'USER_DECISION') {
    handleUserDecision(message.data);
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
