import { LinkScannerService } from '@/services/LinkScannerService';
import { ClickInterceptorService } from '@/services/ClickInterceptorService';
import { AlertService } from '@/services/AlertService';

/**
 * PARTE 2: SERVIÇOS
 * Programas que funcionam em segundo plano no navegador
 * Inicializados pelo inicializador e geridos por service workers
 */

// Inicializar todos os serviços
async function initializeServices() {
  console.log('🔧 Inicializando serviços do content script...');
  
  // 2.1 - Serviço de varredura de links
  await LinkScannerService.initialize();
  
  // 2.2 - Serviço de interceptação de cliques
  await ClickInterceptorService.initialize();
  
  // 2.3 - Serviço de alerta
  AlertService.initialize();
  
  console.log('✅ Todos os serviços inicializados');
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeServices);
} else {
  initializeServices();
}

// Escutar mensagens do background para atualizações de configuração
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'UPDATE_CONFIG':
      updateServicesConfig(message.data);
      break;
    default:
      break;
  }
});

/**
 * Atualiza configuração de todos os serviços
 */
async function updateServicesConfig(newConfig: any) {
  await LinkScannerService.updateConfig(newConfig);
  await ClickInterceptorService.updateConfig(newConfig);
  console.log('🔄 Configuração dos serviços atualizada');
}
