import React, { useState, useEffect } from 'react';
import { StorageService } from '@/services';
import { AnalysisConfig } from '@/types';

const defaultConfig: AnalysisConfig = {
  enabled: true,
  unicodeAnalysis: true,
  blockSuspiciousLinks: true,
  showWarnings: true,
  design: {
    theme: 'light',
    colorScheme: 'default',
    visualIndicators: {
      enabled: true,
      showSafeLinks: true,
      colors: {
        safe: '#dcfce7',
        suspicious: '#fef3c7',
        dangerous: '#fee2e2'
      },
      style: {
        backgroundOpacity: 0.3,
        textContrast: true
      }
    },
    accessibility: {
      reduceMotion: false,
      highContrast: false,
      largeText: false,
      keyboardNavigation: true
    }
  }
};

export const ConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<AnalysisConfig>(defaultConfig);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await StorageService.getConfig();
      setConfig(savedConfig);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = async (key: keyof AnalysisConfig, value: boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    try {
      await StorageService.setConfig(newConfig);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Configurações de Segurança
      </h3>

      <div className="space-y-3">
        <ConfigToggle
          label="Ativar análise de segurança"
          description="Ativa/desativa a análise automática de links"
          checked={config.enabled}
          onChange={(checked) => handleConfigChange('enabled', checked)}
        />

        <ConfigToggle
          label="Análise Unicode"
          description="Detecta caracteres suspeitos e scripts mistos em URLs"
          checked={config.unicodeAnalysis}
          onChange={(checked) => handleConfigChange('unicodeAnalysis', checked)}
          disabled={!config.enabled}
        />

        <ConfigToggle
          label="Bloquear links suspeitos"
          description="Impede a navegação automática para sites suspeitos"
          checked={config.blockSuspiciousLinks}
          onChange={(checked) => handleConfigChange('blockSuspiciousLinks', checked)}
          disabled={!config.enabled}
        />

        <ConfigToggle
          label="Mostrar avisos"
          description="Exibe janelas de aviso quando sites suspeitos são detectados"
          checked={config.showWarnings}
          onChange={(checked) => handleConfigChange('showWarnings', checked)}
          disabled={!config.enabled}
        />
      </div>
    </div>
  );
};

interface ConfigToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ConfigToggle: React.FC<ConfigToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <div className={`p-3 rounded-lg transition-colors ${disabled ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}>
      <div className="flex items-center justify-between">
        <span className={`font-medium ${disabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
          {label}
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
        </label>
      </div>
      <p className={`text-sm mt-1 ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
        {description}
      </p>
    </div>
  );
};
