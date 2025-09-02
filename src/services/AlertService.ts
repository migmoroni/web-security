import { UrlAnalysisResult } from '@/types';

/**
 * PARTE 2.3: SERVIÇO DE ALERTA
 * Programa que mostra mensagem de alerta para links do tipo 2 ou 3
 * Explica o que foi encontrado em detalhes, caso usuário queira ler
 * Permite voltar ou prosseguir
 */
export class AlertService {
  private static currentAlert?: HTMLElement;

  /**
   * Mostra alerta de segurança na página
   */
  static showAlert(analysis: UrlAnalysisResult, originalEvent: any) {
    // Remover alerta anterior se existir
    this.removeCurrentAlert();

    const alertElement = this.createAlertElement(analysis, originalEvent);
    document.body.appendChild(alertElement);
    this.currentAlert = alertElement;

    console.log(`🚨 Alerta exibido para URL tipo ${analysis.type}: ${analysis.url}`);
  }

  /**
   * Cria elemento HTML do alerta
   */
  private static createAlertElement(analysis: UrlAnalysisResult, originalEvent: any): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'security-alert-overlay';
    
    // Determinar cores e ícones baseados no tipo
    const alertConfig = this.getAlertConfig(analysis.type as 2 | 3);
    
    overlay.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 999999; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
          
          <!-- Cabeçalho -->
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">${alertConfig.icon}</div>
            <h2 style="color: ${alertConfig.color}; margin: 0; font-size: 24px;">${alertConfig.title}</h2>
          </div>
          
          <!-- URL -->
          <div style="margin-bottom: 20px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #6b7280;">URL detectada:</p>
            <p style="font-weight: bold; margin: 0; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace;">${analysis.url}</p>
          </div>
          
          <!-- Resumo da análise -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 18px;">Resumo da Análise</h3>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">${alertConfig.summary}</p>
          </div>
          
          <!-- Detalhes (colapsável) -->
          <details style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px;">
            <summary style="font-weight: bold; color: #374151; cursor: pointer; margin-bottom: 8px;">Ver detalhes da análise</summary>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              ${this.generateDetailsHtml(analysis)}
            </div>
          </details>
          
          <!-- Botões -->
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="security-alert-back" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background-color 0.2s;">
              ← Voltar
            </button>
            <button id="security-alert-proceed" style="padding: 12px 24px; background: ${alertConfig.proceedColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background-color 0.2s;">
              Prosseguir mesmo assim →
            </button>
          </div>
          
        </div>
      </div>
    `;

    // Configurar eventos dos botões
    this.setupAlertEvents(overlay, analysis, originalEvent);
    
    return overlay;
  }

  /**
   * Retorna configuração visual baseada no tipo de alerta
   */
  private static getAlertConfig(type: 2 | 3) {
    const configs = {
      2: {
        icon: '⚠️',
        title: 'Link Suspeito',
        color: '#f59e0b',
        proceedColor: '#f59e0b',
        summary: 'Este link apresenta características suspeitas que podem indicar tentativa de phishing ou spoofing. Recomendamos cautela.'
      },
      3: {
        icon: '🛡️',
        title: 'Link Perigoso',
        color: '#dc2626',
        proceedColor: '#dc2626',
        summary: 'Este link foi identificado como perigoso por fontes de inteligência de ameaças. NÃO recomendamos o acesso.'
      }
    };
    
    return configs[type];
  }

  /**
   * Gera HTML dos detalhes da análise
   */
  private static generateDetailsHtml(analysis: UrlAnalysisResult): string {
    let html = '';
    
    if (analysis.details.lexical) {
      html += `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #374151;">Análise Léxica</h4>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${analysis.details.lexical.explanation}</p>
          ${analysis.details.lexical.scripts.length > 0 ? `
            <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Scripts detectados:</strong> ${analysis.details.lexical.scripts.join(', ')}</p>
          ` : ''}
        </div>
      `;
    }
    
    if (analysis.details.reputation) {
      html += `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #374151;">Análise de Reputação</h4>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${analysis.details.reputation.details}</p>
          ${analysis.details.reputation.sources.length > 0 ? `
            <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Fontes:</strong> ${analysis.details.reputation.sources.join(', ')}</p>
          ` : ''}
        </div>
      `;
    }
    
    return html || '<p style="color: #6b7280; font-size: 14px;">Nenhum detalhe adicional disponível.</p>';
  }

  /**
   * Configura eventos dos botões do alerta
   */
  private static setupAlertEvents(overlay: HTMLElement, analysis: UrlAnalysisResult, originalEvent: any) {
    const backButton = overlay.querySelector('#security-alert-back');
    const proceedButton = overlay.querySelector('#security-alert-proceed');

    backButton?.addEventListener('click', () => {
      this.removeCurrentAlert();
      console.log('👈 Usuário escolheu voltar');
    });

    proceedButton?.addEventListener('click', () => {
      this.removeCurrentAlert();
      
      // Enviar decisão para background
      chrome.runtime.sendMessage({
        type: 'USER_DECISION',
        data: {
          proceed: true,
          url: analysis.url,
          openInNewTab: originalEvent.ctrlKey || originalEvent.metaKey
        }
      });
      
      console.log('➡️ Usuário escolheu prosseguir');
    });

    // Fechar com ESC
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.currentAlert) {
        this.removeCurrentAlert();
      }
    }, { once: true });
  }

  /**
   * Remove alerta atual
   */
  private static removeCurrentAlert() {
    if (this.currentAlert && this.currentAlert.parentNode) {
      this.currentAlert.parentNode.removeChild(this.currentAlert);
      this.currentAlert = undefined;
    }
  }

  /**
   * Expõe função global para ser chamada pelo background
   */
  static initialize() {
    (window as any).showSecurityWarning = (analysis: UrlAnalysisResult, originalEvent: any) => {
      this.showAlert(analysis, originalEvent);
    };
    
    console.log('✅ AlertService inicializado');
  }
}
