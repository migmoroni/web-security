# Configuração de APIs - Web Security Analyzer

## 🔧 Configuração das APIs Externas

### PhishTank API
1. Acesse: https://www.phishtank.com/api_info.php
2. Registre-se para obter uma API key gratuita
3. Adicione a chave no arquivo `src/config/api-keys.ts`:
```typescript
export const API_KEYS = {
  phishTank: 'SUA_CHAVE_PHISHTANK_AQUI'
};
```

### VirusTotal API  
1. Acesse: https://www.virustotal.com/gui/join-us
2. Crie uma conta gratuita
3. Acesse: https://www.virustotal.com/gui/my-apikey
4. Copie sua API key
5. Adicione no arquivo `src/config/api-keys.ts`:
```typescript
export const API_KEYS = {
  phishTank: 'SUA_CHAVE_PHISHTANK_AQUI',
  virusTotal: 'SUA_CHAVE_VIRUSTOTAL_AQUI'
};
```

## 📊 Limites das APIs

### PhishTank (Gratuito)
- **Rate Limit**: 300 requests/minuto
- **Limite Diário**: 10.000 requests/dia
- **Dados**: Base colaborativa de phishing verificado
- **Latência**: ~200-500ms

### VirusTotal (Gratuito)
- **Rate Limit**: 4 requests/minuto
- **Limite Diário**: 1.000 requests/dia  
- **Dados**: 70+ engines antivírus
- **Latência**: ~1-3 segundos

## 🛡️ Fallback Strategy

### Quando APIs Falham
1. **Verificação Local**: Continua com analisadores internos
2. **Cache**: Resultados são cacheados por 15 minutos
3. **Whitelist**: Domínios conhecidos pulam verificação externa
4. **Timeout**: 5 segundos máximo por API

### Ordem de Prioridade
1. **Whitelist Local** (instantâneo)
2. **Cache** (instantâneo)
3. **PhishTank** (phishing específico)
4. **VirusTotal** (malware geral)
5. **Análise Local** (alfabetos, similaridade)

## 🔒 Segurança e Privacidade

### Dados Enviados
- **Apenas hostname**: Nunca enviamos paths ou parâmetros
- **Criptografia**: Todas as requisições via HTTPS
- **Cache Local**: Reduz exposição de dados

### Exemplo de URL Processada
```
Original: https://accounts.google.com/signin/oauth?param=123
Enviado para APIs: google.com
```

## 🧪 Testando a Configuração

### Verificar Conectividade
```javascript
// No console da extensão
ThreatIntelligenceService.testConnectivity().then(console.log);
// Resultado: { phishTank: true, virusTotal: true }
```

### Testar API Específica
```javascript
// Testar PhishTank
ThreatIntelligenceService.checkUrl('http://example.com').then(console.log);
```

## 📈 Monitoramento

### Logs Disponíveis
- Conectividade das APIs
- Cache hits/misses  
- Timeouts e erros
- Rate limiting

### Métricas Importantes
- Taxa de sucesso das APIs
- Tempo médio de resposta
- Cache hit ratio
- Falsos positivos/negativos

---

**Nota**: As chaves de API devem ser mantidas seguras e nunca commitadas no repositório. Use variáveis de ambiente em produção.
