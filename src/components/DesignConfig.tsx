import React, { useState, useEffect } from 'react';
import { DesignConfig as DesignConfigType, VisualIndicatorConfig } from '@/types';
import { StorageService } from '@/services';

export const DesignConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<DesignConfigType>({
    theme: 'light',
    colorScheme: 'default',
    visualIndicators: {
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
    },
    accessibility: {
      reduceMotion: false,
      highContrast: false,
      largeText: false,
      keyboardNavigation: true
    }
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const storageConfig = await StorageService.getConfig();
      if (storageConfig.design) {
        setConfig(storageConfig.design);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de design:', error);
    }
  };

  const saveConfig = async (newConfig: DesignConfigType) => {
    try {
      const currentConfig = await StorageService.getConfig();
      currentConfig.design = newConfig;
      await StorageService.setConfig(currentConfig);
      
      setConfig(newConfig);
      
      // Aplicar tema globalmente
      applyGlobalTheme(newConfig);
      
      // Atualizar content scripts
      broadcastDesignUpdate(newConfig);
    } catch (error) {
      console.error('Erro ao salvar configuração de design:', error);
    }
  };

  const applyGlobalTheme = (designConfig: DesignConfigType) => {
    const root = document.documentElement;
    
    // Aplicar variáveis CSS globais baseadas no tema
    if (designConfig.theme === 'dark') {
      root.style.setProperty('--bg-primary', '#1f2937');
      root.style.setProperty('--bg-secondary', '#374151');
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f9fafb');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
    }
    
    // Aplicar cores do esquema selecionado
    const colors = getColorScheme(designConfig.colorScheme, designConfig.visualIndicators.colors);
    root.style.setProperty('--color-safe', colors.safe);
    root.style.setProperty('--color-suspicious', colors.suspicious);
    root.style.setProperty('--color-dangerous', colors.dangerous);
  };

    const broadcastDesignUpdate = (designConfig: DesignConfigType) => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'UPDATE_DESIGN_CONFIG',
            data: designConfig
          }).catch(() => {});
        }
      });
    });
  };

  const getColorScheme = (scheme: string, customColors: VisualIndicatorConfig['colors']) => {
    const schemes = {
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
      },
      custom: customColors
    };
    
    return schemes[scheme] || schemes.default;
  };

  const updateConfig = (updates: Partial<DesignConfigType>) => {
    const newConfig = { ...config, ...updates };
    saveConfig(newConfig);
  };

  const updateVisualIndicators = (updates: Partial<VisualIndicatorConfig>) => {
    const newConfig = {
      ...config,
      visualIndicators: { ...config.visualIndicators, ...updates }
    };
    saveConfig(newConfig);
  };

  const updateAccessibility = (updates: Partial<typeof config.accessibility>) => {
    const newConfig = {
      ...config,
      accessibility: { ...config.accessibility, ...updates }
    };
    saveConfig(newConfig);
  };

  const setColorScheme = (scheme: typeof config.colorScheme) => {
    const colors = getColorScheme(scheme, config.visualIndicators.colors);
    const newConfig = {
      ...config,
      colorScheme: scheme,
      visualIndicators: {
        ...config.visualIndicators,
        colors
      }
    };
    saveConfig(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Tema Global */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Tema Global</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema da Interface
            </label>
            <select
              value={config.theme}
              onChange={(e) => updateConfig({ theme: e.target.value as any })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="light">☀️ Claro</option>
              <option value="dark">🌙 Escuro</option>
              <option value="auto">🔄 Automático</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Esquema de Cores
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'default', label: '🎨 Padrão', desc: 'Verde, Laranja, Vermelho' },
                { id: 'colorblind', label: '👁️ Daltonismo', desc: 'Azul, Roxo, Laranja' },
                { id: 'highContrast', label: '🔆 Alto Contraste', desc: 'Cores mais escuras' },
                { id: 'subtle', label: '🌙 Sutil', desc: 'Cores mais claras' }
              ].map(scheme => (
                <button
                  key={scheme.id}
                  onClick={() => setColorScheme(scheme.id as any)}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    config.colorScheme === scheme.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{scheme.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{scheme.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Indicadores Visuais */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Indicadores de Links</h3>
        
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="visual-enabled"
            checked={config.visualIndicators.enabled}
            onChange={(e) => updateVisualIndicators({ enabled: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="visual-enabled" className="font-medium">
            Habilitar Indicadores Visuais
          </label>
        </div>

        {config.visualIndicators.enabled && (
          <div className="space-y-4 ml-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-safe"
                checked={config.visualIndicators.showSafeLinks}
                onChange={(e) => updateVisualIndicators({ showSafeLinks: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="show-safe">
                Mostrar indicador para links seguros
              </label>
            </div>

            {config.colorScheme === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    🟢 Links Seguros
                  </label>
                  <input
                    type="color"
                    value={config.visualIndicators.colors.safe}
                    onChange={(e) => updateVisualIndicators({
                      colors: { ...config.visualIndicators.colors, safe: e.target.value }
                    })}
                    className="w-full h-10 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    🟡 Links Suspeitos
                  </label>
                  <input
                    type="color"
                    value={config.visualIndicators.colors.suspicious}
                    onChange={(e) => updateVisualIndicators({
                      colors: { ...config.visualIndicators.colors, suspicious: e.target.value }
                    })}
                    className="w-full h-10 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    🔴 Links Perigosos
                  </label>
                  <input
                    type="color"
                    value={config.visualIndicators.colors.dangerous}
                    onChange={(e) => updateVisualIndicators({
                      colors: { ...config.visualIndicators.colors, dangerous: e.target.value }
                    })}
                    className="w-full h-10 rounded"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Estilo da Borda:
              </label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Espessura</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={config.visualIndicators.borderStyle.width}
                    onChange={(e) => updateVisualIndicators({
                      borderStyle: { ...config.visualIndicators.borderStyle, width: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{config.visualIndicators.borderStyle.width}px</span>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Estilo</label>
                  <select
                    value={config.visualIndicators.borderStyle.style}
                    onChange={(e) => updateVisualIndicators({
                      borderStyle: { ...config.visualIndicators.borderStyle, style: e.target.value as any }
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
        )}
      </section>

      {/* Acessibilidade */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">♿ Acessibilidade</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reduce-motion"
              checked={config.accessibility.reduceMotion}
              onChange={(e) => updateAccessibility({ reduceMotion: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="reduce-motion">Reduzir animações</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="high-contrast"
              checked={config.accessibility.highContrast}
              onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="high-contrast">Alto contraste</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="large-text"
              checked={config.accessibility.largeText}
              onChange={(e) => updateAccessibility({ largeText: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="large-text">Texto aumentado</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="keyboard-nav"
              checked={config.accessibility.keyboardNavigation}
              onChange={(e) => updateAccessibility({ keyboardNavigation: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="keyboard-nav">Navegação por teclado</label>
          </div>
        </div>
      </section>

      {/* Prévia */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👁️ Prévia</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div 
              style={{ 
                borderBottom: `${config.visualIndicators.borderStyle.width}px ${config.visualIndicators.borderStyle.style} ${config.visualIndicators.colors.safe}`,
                padding: '8px 0',
                fontSize: config.accessibility.largeText ? '16px' : '14px'
              }}
            >
              🟢 Link Seguro (exemplo: google.com)
            </div>
            <div 
              style={{ 
                borderBottom: `${config.visualIndicators.borderStyle.width}px ${config.visualIndicators.borderStyle.style} ${config.visualIndicators.colors.suspicious}`,
                padding: '8px 0',
                fontSize: config.accessibility.largeText ? '16px' : '14px'
              }}
            >
              🟡 Link Suspeito (exemplo: g00gle.com)
            </div>
            <div 
              style={{ 
                borderBottom: `${config.visualIndicators.borderStyle.width}px ${config.visualIndicators.borderStyle.style} ${config.visualIndicators.colors.dangerous}`,
                padding: '8px 0',
                fontSize: config.accessibility.largeText ? '16px' : '14px'
              }}
            >
              🔴 Link Perigoso (exemplo: phishing-site.com)
            </div>
          </div>
        </div>
      </section>

      {/* Ações Rápidas */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Ações Rápidas</h3>
        <div className="space-y-2">
          <button
            onClick={() => setColorScheme('custom')}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            🎨 Personalizar Cores
          </button>
          
          <button
            onClick={() => updateConfig({
              ...config,
              accessibility: { ...config.accessibility, highContrast: !config.accessibility.highContrast }
            })}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            🔆 Alternar Alto Contraste
          </button>
          
          <button
            onClick={() => updateVisualIndicators({ enabled: !config.visualIndicators.enabled })}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            👁️ Alternar Indicadores Visuais
          </button>
        </div>
      </section>
    </div>
  );
};
