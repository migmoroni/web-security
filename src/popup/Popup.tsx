import React, { useState, useEffect } from 'react';
import { ConfigPanel } from '@/components';
import { DesignConfigPanel } from '@/components/DesignConfigPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { StorageService } from '@/services';

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'design' | 'history'>('status');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    getCurrentTab();
    getAnalysisCount();
  }, []);

  useEffect(() => {
    const applyTheme = async () => {
      const config = await StorageService.getDesignConfig();
      setTheme(config.theme);
    };
    applyTheme();
  }, []);

  const getCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setCurrentUrl(tab.url);
      }
    } catch (error) {
      console.error('Erro ao obter aba atual:', error);
    }
  };

  const getAnalysisCount = async () => {
    try {
      const history = await StorageService.getAnalysisHistory();
      setAnalysisCount(history.length);
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
    }
  };

  const openDemoPage = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('demo.html')
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'status':
        return (
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Web Security Analyzer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Proteção ativa contra sites suspeitos
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Status:</span>
                  <span className="px-2 py-1 bg-success-100 text-success-700 rounded text-xs font-medium dark:bg-success-900 dark:text-success-200">
                    Ativo
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">URLs analisadas:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{analysisCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Site atual:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate ml-2 max-w-32">
                    {new URL(currentUrl || 'about:blank').hostname}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('config')}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium mb-2"
            >
              ⚙️ Configurar Sistema
            </button>
            
            <button
              onClick={() => setActiveTab('design')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium mb-2"
            >
              🎨 Configurar Design
            </button>
            
            <button
              onClick={openDemoPage}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              🧪 Página de Demonstração
            </button>
          </div>
        );

      case 'config':
        return (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setActiveTab('status')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mr-3"
              >
                ← Voltar
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ⚙️ Configurações do Sistema
              </h3>
            </div>
            <ConfigPanel />
          </div>
        );

      case 'design':
        return (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setActiveTab('status')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mr-3"
              >
                ← Voltar
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                🎨 Configurações de Design
              </h3>
            </div>
            <DesignConfigPanel />
          </div>
        );

      case 'history':
        return (
          <div>
            <div className="flex items-center p-4 pb-2">
              <button
                onClick={() => setActiveTab('status')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mr-3"
              >
                ← Voltar
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                📋 Histórico de Análises
              </h3>
            </div>
            <HistoryPanel />
          </div>
        );

      case 'history':
        return (
          <div>
            <div className="flex items-center p-4 pb-2">
              <button
                onClick={() => setActiveTab('status')}
                className="text-gray-600 hover:text-gray-900 mr-3"
              >
                ← Voltar
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Histórico de Análises
              </h3>
            </div>
            <HistoryPanel />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full h-full bg-white dark:bg-gray-800 ${theme}`}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex">
          {[
            { id: 'status', label: 'Status', icon: '🏠' },
            { id: 'config', label: 'Sistema', icon: '⚙️' },
            { id: 'design', label: 'Design', icon: '🎨' },
            { id: 'history', label: 'Histórico', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-3 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-gray-700 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-y-auto" style={{ height: 'calc(500px - 48px)' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Popup;
