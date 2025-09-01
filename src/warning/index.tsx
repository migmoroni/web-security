import React from 'react';
import { createRoot } from 'react-dom/client';
import { SecurityWarning } from '@/components';
import '../styles/globals.css';

// Obter dados da URL
const urlParams = new URLSearchParams(window.location.search);
const dataParam = urlParams.get('data');

if (dataParam) {
  try {
    const data = JSON.parse(decodeURIComponent(dataParam));
    
    const handleProceed = () => {
      // Enviar decisão para o background script
      chrome.runtime.sendMessage({
        type: 'USER_DECISION',
        data: {
          proceed: true,
          url: data.analysis.url,
          openInNewTab: data.originalEvent.ctrlKey || data.originalEvent.metaKey
        }
      });
    };

    const handleCancel = () => {
      // Enviar decisão para o background script
      chrome.runtime.sendMessage({
        type: 'USER_DECISION',
        data: {
          proceed: false,
          url: data.analysis.url,
          openInNewTab: false
        }
      });
    };

    const container = document.getElementById('warning-root');
    if (container) {
      const root = createRoot(container);
      root.render(
        <SecurityWarning 
          analysis={data.analysis}
          onProceed={handleProceed}
          onCancel={handleCancel}
        />
      );
    }
  } catch (error) {
    console.error('Erro ao carregar dados de aviso:', error);
    // Fechar janela em caso de erro
    window.close();
  }
} else {
  // Fechar janela se não há dados
  window.close();
}
