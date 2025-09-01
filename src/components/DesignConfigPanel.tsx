import React, { useState, useEffect } from 'react';
import { DesignConfig, AccessibilityConfig } from '../types';
import { StorageService } from '../services/StorageService';

interface DesignConfigPanelProps {
  onConfigChange?: (config: DesignConfig) => void;
}

const defaultDesignConfig: DesignConfig = {
  theme: 'auto',
  colorScheme: 'default',
  visualIndicators: {
    enabled: true,
    showSafeLinks: true,
    colors: {
      safe: '#dcfce7',      // Verde claro para background
      suspicious: '#fef3c7', // Amarelo claro para background
      dangerous: '#fee2e2'   // Vermelho claro para background
    },
    style: {
      backgroundOpacity: 1.0,
      textContrast: true
    }
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    keyboardNavigation: true
  }
};

const colorSchemePresets = {
  default: {
    safe: '#dcfce7',      // Verde claro
    suspicious: '#fef3c7', // Amarelo claro
    dangerous: '#fee2e2'   // Vermelho claro
  },
  colorblind: {
    safe: '#dbeafe',      // Azul claro para seguro
    suspicious: '#fecaca', // Vermelho claro para suspeito
    dangerous: '#fee2e2'   // Vermelho mais escuro para perigoso
  },
  highContrast: {
    safe: '#f0f0f0',      // Cinza muito claro
    suspicious: '#d0d0d0', // Cinza médio
    dangerous: '#c0c0c0'   // Cinza escuro
  },
  subtle: {
    safe: '#f0fdf4',      // Verde muito sutil
    suspicious: '#fffbeb', // Amarelo muito sutil
    dangerous: '#fef2f2'   // Vermelho muito sutil
  }
};

export const DesignConfigPanel: React.FC<DesignConfigPanelProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<DesignConfig>(defaultDesignConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await StorageService.getDesignConfig();
      setConfig(savedConfig);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar configuração de design:', error);
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: DesignConfig) => {
    try {
      await StorageService.saveDesignConfig(newConfig);
      setConfig(newConfig);
      onConfigChange?.(newConfig);
      
      // Aplicar tema globalmente
      applyGlobalTheme(newConfig);
    } catch (error) {
      console.error('Erro ao salvar configuração de design:', error);
    }
  };

  const applyGlobalTheme = (designConfig: DesignConfig) => {
    const root = document.documentElement;
    
    // Aplicar tema
    if (designConfig.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (designConfig.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // auto - detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }

    // Aplicar cores dos indicadores visuais
    root.style.setProperty('--safe-color', designConfig.visualIndicators.colors.safe);
    root.style.setProperty('--suspicious-color', designConfig.visualIndicators.colors.suspicious);
    root.style.setProperty('--dangerous-color', designConfig.visualIndicators.colors.dangerous);
    
    // Aplicar configurações de acessibilidade
    if (designConfig.accessibility.reduceMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
    }
    
    if (designConfig.accessibility.largeText) {
      root.style.setProperty('--font-scale', '1.2');
    } else {
      root.style.setProperty('--font-scale', '1');
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    const newConfig = { ...config, theme };
    saveConfig(newConfig);
  };

  const handleColorSchemeChange = (scheme: keyof typeof colorSchemePresets) => {
    const colors = colorSchemePresets[scheme];
    const newConfig = {
      ...config,
      colorScheme: scheme,
      visualIndicators: {
        ...config.visualIndicators,
        colors: colors
      }
    };
    saveConfig(newConfig);
  };

  const handleVisualIndicatorChange = (key: keyof DesignConfig['visualIndicators'], value: any) => {
    const newConfig = {
      ...config,
      visualIndicators: {
        ...config.visualIndicators,
        [key]: value
      }
    };
    saveConfig(newConfig);
  };

  const handleAccessibilityChange = (key: keyof AccessibilityConfig, value: boolean) => {
    const newConfig = {
      ...config,
      accessibility: {
        ...config.accessibility,
        [key]: value
      }
    };
    saveConfig(newConfig);
  };

  const resetToDefaults = () => {
    saveConfig(defaultDesignConfig);
  };

  if (loading) {
    return <div className="p-4 text-center dark:text-gray-300">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tema */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">🎨 Tema</h3>
        <div className="space-y-2">
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <label key={theme} className="flex items-center space-x-2 dark:text-gray-300">
              <input
                type="radio"
                name="theme"
                checked={config.theme === theme}
                onChange={() => handleThemeChange(theme)}
                className="text-blue-600"
              />
              <span className="capitalize">
                {theme === 'auto' ? 'Automático (Sistema)' : 
                 theme === 'light' ? 'Claro' : 'Escuro'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Indicadores Visuais */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">👁️ Indicadores Visuais</h3>
        
        <label className="flex items-center space-x-2 mb-4 dark:text-gray-300">
          <input
            type="checkbox"
            checked={config.visualIndicators.enabled}
            onChange={(e) => handleVisualIndicatorChange('enabled', e.target.checked)}
            className="text-blue-600"
          />
          <span>Ativar indicadores visuais nos links</span>
        </label>

        {config.visualIndicators.enabled && (
          <div className="space-y-4">
            <label className="flex items-center space-x-2 dark:text-gray-300">
              <input
                type="checkbox"
                checked={config.visualIndicators.showSafeLinks}
                onChange={(e) => handleVisualIndicatorChange('showSafeLinks', e.target.checked)}
                className="text-blue-600"
              />
              <span>Mostrar indicadores em links seguros</span>
            </label>

            {/* Esquema de Cores - movido para cá */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600">
              <h4 className="text-sm font-medium mb-3 dark:text-gray-200">Esquemas de Cores</h4>
              <div className="space-y-2">
                {(Object.keys(colorSchemePresets) as Array<keyof typeof colorSchemePresets>).map((scheme) => (
                  <label key={scheme} className="flex items-center space-x-3 text-sm dark:text-gray-300">
                    <input
                      type="radio"
                      name="colorScheme"
                      checked={config.colorScheme === scheme}
                      onChange={() => handleColorSchemeChange(scheme)}
                      className="text-blue-600"
                    />
                    <span className="flex-1">
                      {scheme === 'default' ? 'Padrão' :
                       scheme === 'colorblind' ? 'Daltonismo' :
                       scheme === 'highContrast' ? 'Alto Contraste' :
                       scheme === 'subtle' ? 'Sutil' : scheme}
                    </span>
                    <div className="flex space-x-1">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: colorSchemePresets[scheme].safe }}
                        title="Seguro"
                      />
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: colorSchemePresets[scheme].suspicious }}
                        title="Suspeito"
                      />
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: colorSchemePresets[scheme].dangerous }}
                        title="Perigoso"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Cores Personalizadas */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cor Seguro</label>
                <input
                  type="color"
                  value={config.visualIndicators.colors.safe}
                  onChange={(e) => handleVisualIndicatorChange('colors', {
                    ...config.visualIndicators.colors,
                    safe: e.target.value
                  })}
                  className="w-full h-8 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cor Suspeito</label>
                <input
                  type="color"
                  value={config.visualIndicators.colors.suspicious}
                  onChange={(e) => handleVisualIndicatorChange('colors', {
                    ...config.visualIndicators.colors,
                    suspicious: e.target.value
                  })}
                  className="w-full h-8 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cor Perigoso</label>
                <input
                  type="color"
                  value={config.visualIndicators.colors.dangerous}
                  onChange={(e) => handleVisualIndicatorChange('colors', {
                    ...config.visualIndicators.colors,
                    dangerous: e.target.value
                  })}
                  className="w-full h-8 border rounded"
                />
              </div>
            </div>

            {/* Preview dos indicadores */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600">
              <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Prévia dos Indicadores:</h4>
              <div className="space-y-2">
                <a 
                  href="#" 
                  className={`block p-2 text-blue-600 hover:underline ${config.visualIndicators.style.textContrast ? 'font-medium' : ''}`}
                  style={{
                    backgroundColor: config.visualIndicators.colors.safe,
                    opacity: config.visualIndicators.style.backgroundOpacity
                  }}
                >
                  Link Seguro (exemplo.com)
                </a>
                <a 
                  href="#" 
                  className={`block p-2 text-blue-600 hover:underline ${config.visualIndicators.style.textContrast ? 'font-medium' : ''}`}
                  style={{
                    backgroundColor: config.visualIndicators.colors.suspicious,
                    opacity: config.visualIndicators.style.backgroundOpacity
                  }}
                >
                  Link Suspeito (g00gle.com)
                </a>
                <a 
                  href="#" 
                  className={`block p-2 text-blue-600 hover:underline ${config.visualIndicators.style.textContrast ? 'font-medium' : ''}`}
                  style={{
                    backgroundColor: config.visualIndicators.colors.dangerous,
                    opacity: config.visualIndicators.style.backgroundOpacity
                  }}
                >
                  Link Perigoso (аррle.com)
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Acessibilidade */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">♿ Acessibilidade</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2 dark:text-gray-300">
            <input
              type="checkbox"
              checked={config.accessibility.reduceMotion}
              onChange={(e) => handleAccessibilityChange('reduceMotion', e.target.checked)}
              className="text-blue-600"
            />
            <span>Reduzir animações</span>
          </label>
          
          <label className="flex items-center space-x-2 dark:text-gray-300">
            <input
              type="checkbox"
              checked={config.accessibility.highContrast}
              onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
              className="text-blue-600"
            />
            <span>Alto contraste</span>
          </label>
          
          <label className="flex items-center space-x-2 dark:text-gray-300">
            <input
              type="checkbox"
              checked={config.accessibility.largeText}
              onChange={(e) => handleAccessibilityChange('largeText', e.target.checked)}
              className="text-blue-600"
            />
            <span>Texto maior</span>
          </label>
          
          <label className="flex items-center space-x-2 dark:text-gray-300">
            <input
              type="checkbox"
              checked={config.accessibility.keyboardNavigation}
              onChange={(e) => handleAccessibilityChange('keyboardNavigation', e.target.checked)}
              className="text-blue-600"
            />
            <span>Navegação por teclado aprimorada</span>
          </label>
        </div>
      </div>

      {/* Reset */}
      <div className="pt-4 border-t dark:border-gray-600">
        <button
          onClick={resetToDefaults}
          className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          🔄 Restaurar Padrões
        </button>
      </div>
    </div>
  );
};
