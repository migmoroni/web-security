import React, { useState, useEffect } from 'react';
import { VisualIndicatorConfig } from '@/types';
import { StorageService } from '@/services';

interface VisualConfigProps {
  onConfigChange?: (config: VisualIndicatorConfig) => void;
}

export const VisualConfig: React.FC<VisualConfigProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<VisualIndicatorConfig>({
    enabled: true,
    showSafeLinks: true,
    colors: {
      safe: '#10b981',
      suspicious: '#f59e0b',
      dangerous: '#ef4444'
    },
    borderStyle: {
      width: 2,
      style: 'solid'
    }
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const storageConfig = await StorageService.getConfig();
      if (storageConfig.visualIndicators) {
        setConfig(storageConfig.visualIndicators);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração visual:', error);
    }
  };

  const saveConfig = async (newConfig: VisualIndicatorConfig) => {
    try {
      const currentConfig = await StorageService.getConfig();
      currentConfig.visualIndicators = newConfig;
      await StorageService.setConfig(currentConfig);
      
      setConfig(newConfig);
      onConfigChange?.(newConfig);
      
      // Enviar mensagem para atualizar content scripts
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'UPDATE_VISUAL_CONFIG',
              data: newConfig
            }).catch(() => {}); // Ignorar erros para tabs sem content script
          }
        });
      });
    } catch (error) {
      console.error('Erro ao salvar configuração visual:', error);
    }
  };

  const updateConfig = (updates: Partial<VisualIndicatorConfig>) => {
    const newConfig = { ...config, ...updates };
    saveConfig(newConfig);
  };

  const updateColors = (colorType: keyof VisualIndicatorConfig['colors'], color: string) => {
    const newConfig = {
      ...config,
      colors: {
        ...config.colors,
        [colorType]: color
      }
    };
    saveConfig(newConfig);
  };

  const presetColors = {
    default: {
      safe: '#10b981',
      suspicious: '#f59e0b', 
      dangerous: '#ef4444'
    },
    colorblind: {
      safe: '#0ea5e9',      // Azul
      suspicious: '#8b5cf6', // Roxo
      dangerous: '#f97316'   // Laranja
    },
    highContrast: {
      safe: '#059669',      // Verde escuro
      suspicious: '#d97706', // Laranja escuro
      dangerous: '#dc2626'   // Vermelho escuro
    },
    subtle: {
      safe: '#6ee7b7',      // Verde claro
      suspicious: '#fcd34d', // Amarelo claro
      dangerous: '#fca5a5'   // Vermelho claro
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="visual-enabled"
          checked={config.enabled}
          onChange={(e) => updateConfig({ enabled: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="visual-enabled" className="font-medium">
          Habilitar Indicadores Visuais
        </label>
      </div>

      {config.enabled && (
        <>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-safe"
                checked={config.showSafeLinks}
                onChange={(e) => updateConfig({ showSafeLinks: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="show-safe">
                Mostrar indicador para links seguros
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  🟢 Links Seguros
                </label>
                <input
                  type="color"
                  value={config.colors.safe}
                  onChange={(e) => updateColors('safe', e.target.value)}
                  className="w-full h-10 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  🟡 Links Suspeitos
                </label>
                <input
                  type="color"
                  value={config.colors.suspicious}
                  onChange={(e) => updateColors('suspicious', e.target.value)}
                  className="w-full h-10 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  🔴 Links Perigosos
                </label>
                <input
                  type="color"
                  value={config.colors.dangerous}
                  onChange={(e) => updateColors('dangerous', e.target.value)}
                  className="w-full h-10 rounded"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Presets para Acessibilidade:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(presetColors).map(([name, colors]) => (
                  <button
                    key={name}
                    onClick={() => updateConfig({ colors })}
                    className="p-2 border rounded hover:bg-gray-50 text-sm"
                  >
                    {name === 'default' && '🎨 Padrão'}
                    {name === 'colorblind' && '👁️ Daltonismo'}
                    {name === 'highContrast' && '🔆 Alto Contraste'}
                    {name === 'subtle' && '🌙 Sutil'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Estilo da Borda:
              </label>
              <div className="flex space-x-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espessura</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={config.borderStyle.width}
                    onChange={(e) => updateConfig({
                      borderStyle: { ...config.borderStyle, width: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{config.borderStyle.width}px</span>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Estilo</label>
                  <select
                    value={config.borderStyle.style}
                    onChange={(e) => updateConfig({
                      borderStyle: { ...config.borderStyle, style: e.target.value as any }
                    })}
                    className="border rounded px-2 py-1"
                  >
                    <option value="solid">Sólida</option>
                    <option value="dashed">Tracejada</option>
                    <option value="dotted">Pontilhada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium mb-2">Prévia:</h4>
            <div className="space-y-2">
              <div 
                style={{ 
                  borderBottom: `${config.borderStyle.width}px ${config.borderStyle.style} ${config.colors.safe}`,
                  padding: '4px 0'
                }}
              >
                🟢 Link Seguro (exemplo: google.com)
              </div>
              <div 
                style={{ 
                  borderBottom: `${config.borderStyle.width}px ${config.borderStyle.style} ${config.colors.suspicious}`,
                  padding: '4px 0'
                }}
              >
                🟡 Link Suspeito (exemplo: g00gle.com)
              </div>
              <div 
                style={{ 
                  borderBottom: `${config.borderStyle.width}px ${config.borderStyle.style} ${config.colors.dangerous}`,
                  padding: '4px 0'
                }}
              >
                🔴 Link Perigoso (exemplo: phishing-site.com)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
