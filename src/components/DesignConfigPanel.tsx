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
};

const colorSchemePresets = {
  default: {
    safe: '#10b981',
    suspicious: '#f59e0b',
    dangerous: '#ef4444'
  },
  colorblind: {
    safe: '#2563eb', // azul para seguro
    suspicious: '#dc2626', // vermelho para suspeito
    dangerous: '#991b1b' // vermelho escuro para perigoso
  },
  highContrast: {
    safe: '#000000',
    suspicious: '#666666',
    dangerous: '#000000'
  },
  subtle: {
    safe: '#059669',
    suspicious: '#d97706',
    dangerous: '#dc2626'
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
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else if (designConfig.theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      // auto - detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
      } else {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
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
    return <div className="p-4 text-center">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tema */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🎨 Tema</h3>
        <div className="space-y-2">
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <label key={theme} className="flex items-center space-x-2">
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

      {/* Esquema de Cores */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🎯 Esquema de Cores</h3>
        <div className="space-y-3">
          {(Object.keys(colorSchemePresets) as Array<keyof typeof colorSchemePresets>).map((scheme) => (
            <label key={scheme} className="flex items-center space-x-3">
              <input
                type="radio"
                name="colorScheme"
                checked={config.colorScheme === scheme}
                onChange={() => handleColorSchemeChange(scheme)}
                className="text-blue-600"
              />
              <span className="flex-1">
                {scheme === 'default' ? 'Padrão' :
                 scheme === 'colorblind' ? 'Para Daltonismo' :
                 scheme === 'highContrast' ? 'Alto Contraste' :
                 scheme === 'subtle' ? 'Sutil' : scheme}
              </span>
              <div className="flex space-x-1">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: colorSchemePresets[scheme].safe }}
                  title="Seguro"
                />
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: colorSchemePresets[scheme].suspicious }}
                  title="Suspeito"
                />
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: colorSchemePresets[scheme].dangerous }}
                  title="Perigoso"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Indicadores Visuais */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">👁️ Indicadores Visuais</h3>
        
        <label className="flex items-center space-x-2 mb-4">
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
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.visualIndicators.showSafeLinks}
                onChange={(e) => handleVisualIndicatorChange('showSafeLinks', e.target.checked)}
                className="text-blue-600"
              />
              <span>Mostrar indicadores em links seguros</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">Largura da Borda</label>
              <input
                type="range"
                min="1"
                max="5"
                value={config.visualIndicators.borderStyle.width}
                onChange={(e) => handleVisualIndicatorChange('borderStyle', {
                  ...config.visualIndicators.borderStyle,
                  width: parseInt(e.target.value)
                })}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{config.visualIndicators.borderStyle.width}px</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estilo da Borda</label>
              <select
                value={config.visualIndicators.borderStyle.style}
                onChange={(e) => handleVisualIndicatorChange('borderStyle', {
                  ...config.visualIndicators.borderStyle,
                  style: e.target.value as 'solid' | 'dashed' | 'dotted'
                })}
                className="w-full p-2 border rounded"
              >
                <option value="solid">Sólida</option>
                <option value="dashed">Tracejada</option>
                <option value="dotted">Pontilhada</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Cor Seguro</label>
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
                <label className="block text-sm font-medium mb-1">Cor Suspeito</label>
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
                <label className="block text-sm font-medium mb-1">Cor Perigoso</label>
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
            <div className="mt-4 p-3 bg-white rounded border">
              <h4 className="text-sm font-medium mb-2">Prévia dos Indicadores:</h4>
              <div className="space-y-2">
                <a 
                  href="#" 
                  className="block p-2 text-blue-600 hover:underline"
                  style={{
                    borderBottom: `${config.visualIndicators.borderStyle.width}px ${config.visualIndicators.borderStyle.style} ${config.visualIndicators.colors.safe}`
                  }}
                >
                  Link Seguro (exemplo.com)
                </a>
                <a 
                  href="#" 
                  className="block p-2 text-blue-600 hover:underline"
                  style={{
                    borderBottom: `${config.visualIndicators.borderStyle.width}px ${config.visualIndicators.borderStyle.style} ${config.visualIndicators.colors.suspicious}`
                  }}
                >
                  Link Suspeito (g00gle.com)
                </a>
                <a 
                  href="#" 
                  className="block p-2 text-blue-600 hover:underline"
                  style={{
                    borderBottom: `${config.visualIndicators.borderStyle.width}px ${config.visualIndicators.borderStyle.style} ${config.visualIndicators.colors.dangerous}`
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
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">♿ Acessibilidade</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.accessibility.reduceMotion}
              onChange={(e) => handleAccessibilityChange('reduceMotion', e.target.checked)}
              className="text-blue-600"
            />
            <span>Reduzir animações</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.accessibility.highContrast}
              onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
              className="text-blue-600"
            />
            <span>Alto contraste</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.accessibility.largeText}
              onChange={(e) => handleAccessibilityChange('largeText', e.target.checked)}
              className="text-blue-600"
            />
            <span>Texto maior</span>
          </label>
          
          <label className="flex items-center space-x-2">
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

      {/* Presets Rápidos */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">⚡ Presets Rápidos</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleColorSchemeChange('default')}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Padrão
          </button>
          <button
            onClick={() => handleColorSchemeChange('colorblind')}
            className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
          >
            Daltonismo
          </button>
          <button
            onClick={() => handleColorSchemeChange('highContrast')}
            className="p-2 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm"
          >
            Alto Contraste
          </button>
          <button
            onClick={() => handleColorSchemeChange('subtle')}
            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Sutil
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className="pt-4 border-t">
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
