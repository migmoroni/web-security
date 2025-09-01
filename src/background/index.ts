import { SecurityAnalysisResult, VisualIndicatorConfig } from '@/types';
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

interface UpdateColorPresetMessage {
  type: 'UPDATE_COLOR_PRESET';
  data: {
    colors: VisualIndicatorConfig['colors'];
    preset: string;
  };
}

interface ToggleSafeLinksMessage {
  type: 'TOGGLE_SAFE_LINKS';
}

interface ToggleVisualIndicatorsMessage {
  type: 'TOGGLE_VISUAL_INDICATORS';
}

type Message = SecurityWarningMessage | UserDecisionMessage | NavigationBlockedMessage | AllowNavigationMessage | UpdateColorPresetMessage | ToggleSafeLinksMessage | ToggleVisualIndicatorsMessage;

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
chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
  if (message.type === 'SHOW_SECURITY_WARNING') {
    showSecurityWarning(message.data);
  } else if (message.type === 'USER_DECISION') {
    handleUserDecision(message.data);
  } else if (message.type === 'NAVIGATION_BLOCKED') {
    console.log('📊 Navegação bloqueada registrada:', message.data);
  } else if (message.type === 'ALLOW_NAVIGATION') {
    NavigationMonitorService.allowNavigation(message.data.url, message.data.tabId);
  } else if (message.type === 'UPDATE_COLOR_PRESET') {
    await handleColorPresetUpdate(message.data);
  } else if (message.type === 'TOGGLE_SAFE_LINKS') {
    await handleToggleSafeLinks();
  } else if (message.type === 'TOGGLE_VISUAL_INDICATORS') {
    await handleToggleVisualIndicators();
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

// Handlers para configurações visuais
async function handleColorPresetUpdate(data: { colors: VisualIndicatorConfig['colors']; preset: string }) {
  try {
    const { StorageService } = await import('@/services');
    const config = await StorageService.getConfig();
    
    config.visualIndicators.colors = data.colors as VisualIndicatorConfig['colors'];
    await StorageService.setConfig(config);
    
    // Notificar todas as tabs
    broadcastToContentScripts({
      type: 'UPDATE_VISUAL_CONFIG',
      data: config.visualIndicators
    });
    
    console.log(`🎨 Preset de cores "${data.preset}" aplicado`);
  } catch (error) {
    console.error('Erro ao atualizar preset de cores:', error);
  }
}

async function handleToggleSafeLinks() {
  try {
    const { StorageService } = await import('@/services');
    const config = await StorageService.getConfig();
    
    config.visualIndicators.showSafeLinks = !config.visualIndicators.showSafeLinks;
    await StorageService.setConfig(config);
    
    broadcastToContentScripts({
      type: 'UPDATE_VISUAL_CONFIG',
      data: config.visualIndicators
    });
    
    console.log(`🔄 Exibição de links seguros: ${config.visualIndicators.showSafeLinks ? 'ON' : 'OFF'}`);
  } catch (error) {
    console.error('Erro ao alternar links seguros:', error);
  }
}

async function handleToggleVisualIndicators() {
  try {
    const { StorageService } = await import('@/services');
    const config = await StorageService.getConfig();
    
    config.visualIndicators.enabled = !config.visualIndicators.enabled;
    await StorageService.setConfig(config);
    
    broadcastToContentScripts({
      type: 'UPDATE_VISUAL_CONFIG',
      data: config.visualIndicators
    });
    
    console.log(`👁️ Indicadores visuais: ${config.visualIndicators.enabled ? 'ON' : 'OFF'}`);
  } catch (error) {
    console.error('Erro ao alternar indicadores visuais:', error);
  }
}

// Função para broadcast de mensagens para content scripts
function broadcastToContentScripts(message: any) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Ignorar erros para tabs sem content script
        });
      }
    });
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
