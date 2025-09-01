import React, { useState, useEffect } from 'react';
import { StorageService } from '@/services';
import { AnalysisConfig } from '@/types';

export const ConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<AnalysisConfig>({
    enabled: true,
    unicodeAnalysis: true,
    blockSuspiciousLinks: true,
    showWarnings: true
  });

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
        <p className="mt-2 text-sm text-gray-600">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
    <div className={`p-3 rounded-lg border ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm text-gray-900">{label}</span>
        <button
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            checked ? 'bg-primary-600' : 'bg-gray-200'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};
