import React, { useState, useEffect } from 'react';
import { HistoryEntry } from '@/types';
import { StorageService } from '@/services';

export const HistoryPanel: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    safe: 0,
    suspicious: 0,
    dangerous: 0,
    lastWeek: 0
  });
  const [filter, setFilter] = useState<'all' | 'safe' | 'suspicious' | 'dangerous'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'domain' | 'severity'>('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const historyData = await StorageService.getAnalysisHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await StorageService.getHistoryStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const clearHistory = async () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico de análises?')) {
      await StorageService.clearHistory();
      setHistory([]);
      setStats({ total: 0, safe: 0, suspicious: 0, dangerous: 0, lastWeek: 0 });
    }
  };

  const filterHistory = (entries: HistoryEntry[]) => {
    let filtered = entries;

    if (filter !== 'all') {
      filtered = entries.filter(entry => {
        if (filter === 'safe') return !entry.analysis.isSuspicious;
        if (filter === 'suspicious') return entry.analysis.isSuspicious && entry.analysis.suspicionLevel !== 'high';
        if (filter === 'dangerous') return entry.analysis.suspicionLevel === 'high';
        return true;
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === 'date') return b.timestamp - a.timestamp;
      if (sortBy === 'domain') return a.domain.localeCompare(b.domain);
      if (sortBy === 'severity') {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const aScore = a.analysis.isSuspicious ? severityOrder[a.analysis.suspicionLevel] : 0;
        const bScore = b.analysis.isSuspicious ? severityOrder[b.analysis.suspicionLevel] : 0;
        return bScore - aScore;
      }
      return 0;
    });

    return filtered;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const getStatusIcon = (entry: HistoryEntry) => {
    if (!entry.analysis.isSuspicious) return '🟢';
    if (entry.analysis.suspicionLevel === 'high') return '🔴';
    return '🟡';
  };

  const getActionIcon = (action?: string) => {
    if (action === 'blocked') return '🛡️';
    if (action === 'proceeded') return '⚠️';
    return '👁️';
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      click: '🔗 Clique',
      navigation: '🌐 Navegação',
      form: '📝 Formulário',
      popup: '🪟 Popup'
    };
    return labels[source] || source;
  };

  const filteredHistory = filterHistory(history);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Estatísticas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Estatísticas (30 dias)</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.lastWeek}</div>
            <div className="text-gray-600">Esta semana</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">🟢 {stats.safe}</div>
            <div className="text-gray-600">Seguros</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">🔴 {stats.dangerous}</div>
            <div className="text-gray-600">Perigosos</div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="all">Todos</option>
            <option value="safe">🟢 Seguros</option>
            <option value="suspicious">🟡 Suspeitos</option>
            <option value="dangerous">🔴 Perigosos</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="date">📅 Data</option>
            <option value="domain">🌐 Domínio</option>
            <option value="severity">⚠️ Severidade</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadHistory}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            🔄 Atualizar
          </button>
          <button
            onClick={clearHistory}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
          >
            🗑️ Limpar
          </button>
        </div>
      </div>

      {/* Lista do Histórico */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>Nenhuma análise encontrada</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Ver todas as análises
              </button>
            )}
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{getStatusIcon(entry)}</span>
                    <span className="font-medium text-gray-900 truncate">
                      {entry.domain}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {getSourceLabel(entry.source)}
                    </span>
                    {entry.userAction && (
                      <span className="text-xs">
                        {getActionIcon(entry.userAction)}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 truncate mb-2">
                    {entry.url}
                  </div>
                  
                  {entry.analysis.issues.length > 0 && (
                    <div className="text-xs text-gray-600">
                      {entry.analysis.issues.slice(0, 2).map(issue => issue.description).join(', ')}
                      {entry.analysis.issues.length > 2 && ` +${entry.analysis.issues.length - 2} mais`}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {formatDate(entry.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredHistory.length > 0 && (
        <div className="text-center text-xs text-gray-500 pt-2 border-t">
          Mostrando {filteredHistory.length} de {history.length} análises dos últimos 30 dias
        </div>
      )}
    </div>
  );
};
