// PARTE 3: ANALISADORES
// Analisam o que é passado a eles e retornam o resultado da análise

export { LexicalAnalyzer } from './LexicalAnalyzer';
export { ReputationAnalyzer } from './ReputationAnalyzer';

// Manter analisadores antigos por compatibilidade (remover gradualmente)
export { UnicodeAnalyzer } from './UnicodeAnalyzer';
export { SecurityAnalyzer } from './SecurityAnalyzer';
export { AnalyzerRegistry, createDomainReputationAnalyzer, createPhishingAnalyzer } from './AnalyzerRegistry';
