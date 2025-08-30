import React, { useEffect, useState } from 'react';
import { SecurityAnalysisResult } from '@/types';

interface SecurityWarningProps {
  analysis: SecurityAnalysisResult;
  onProceed: () => void;
  onCancel: () => void;
}

export const SecurityWarning: React.FC<SecurityWarningProps> = ({
  analysis,
  onProceed,
  onCancel
}) => {
  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-danger-700 bg-danger-50 border-danger-200';
      case 'medium': return 'text-warning-700 bg-warning-50 border-warning-200';
      default: return 'text-primary-700 bg-primary-50 border-primary-200';
    }
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{getSeverityIcon(analysis.suspicionLevel)}</span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Site Potencialmente Suspeito
          </h2>
          <p className="text-sm text-gray-600">
            Detectamos possíveis problemas de segurança
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-700 mb-2">
          <strong>URL:</strong> 
          <span className="break-all ml-1 font-mono text-xs bg-gray-100 px-1 rounded">
            {analysis.url}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {analysis.issues.map((issue, index) => (
          <div 
            key={index}
            className={`p-3 rounded-md border ${getSeverityColor(issue.severity)}`}
          >
            <div className="font-medium text-sm mb-1">
              {issue.description}
            </div>
            <div className="text-xs">
              {issue.details}
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
        >
          Não Prosseguir
        </button>
        <button
          onClick={onProceed}
          className="flex-1 px-4 py-2 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors font-medium"
        >
          Prosseguir Mesmo Assim
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Esta análise é baseada em padrões automáticos e pode ter falsos positivos.
      </div>
    </div>
  );
};
