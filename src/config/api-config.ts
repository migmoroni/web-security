/**
 * Configuração para APIs externas de threat intelligence
 */

export interface ApiConfig {
  phishTank: {
    enabled: boolean;
    apiUrl: string;
    apiKey?: string;
    timeout: number;
  };
  virusTotal: {
    enabled: boolean;
    apiUrl: string;
    apiKey?: string;
    timeout: number;
  };
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  phishTank: {
    enabled: true,
    apiUrl: 'https://checkurl.phishtank.com/checkurl/',
    timeout: 5000
  },
  virusTotal: {
    enabled: true,
    apiUrl: 'https://www.virustotal.com/vtapi/v2/url/report',
    timeout: 8000
  }
};

/**
 * Configuração de fallback quando APIs não estão disponíveis
 */
export const FALLBACK_CONFIG = {
  useLocalAnalysisOnly: true,
  cacheResults: true,
  maxCacheSize: 100,
  cacheExpiryMinutes: 15
};

/**
 * Lista de domínios conhecidos como seguros (whitelist local)
 * Usada quando APIs externas não estão disponíveis
 */
export const KNOWN_SAFE_DOMAINS = [
  // Grandes tech companies
  'google.com', 'youtube.com', 'gmail.com', 'googlemaps.com',
  'microsoft.com', 'microsoftonline.com', 'office.com', 'outlook.com',
  'apple.com', 'icloud.com', 'itunes.com',
  'amazon.com', 'aws.amazon.com', 'amazon.com.br',
  'facebook.com', 'instagram.com', 'whatsapp.com', 'meta.com',
  
  // Serviços populares
  'netflix.com', 'spotify.com', 'paypal.com', 'ebay.com',
  'github.com', 'gitlab.com', 'stackoverflow.com', 'reddit.com',
  'wikipedia.org', 'twitter.com', 'linkedin.com', 'discord.com',
  
  // Bancos brasileiros
  'bb.com.br', 'bradesco.com.br', 'itau.com.br', 'santander.com.br',
  'caixa.gov.br', 'banrisul.com.br', 'sicoob.com.br', 'sicredi.com.br',
  
  // Sites brasileiros
  'uol.com.br', 'globo.com', 'terra.com.br', 'ig.com.br',
  'mercadolivre.com.br', 'americanas.com.br', 'submarino.com.br',
  'correios.com.br', 'gov.br', 'receita.fazenda.gov.br',
  
  // CDNs e serviços
  'cloudflare.com', 'cloudfront.net', 'googleapis.com',
  'gstatic.com', 'bootstrapcdn.com', 'jquery.com'
];

/**
 * Lista de TLDs considerados seguros por padrão
 */
export const SAFE_TLDS = [
  '.gov', '.edu', '.mil', '.org', 
  '.gov.br', '.edu.br', '.mil.br',
  '.ac.uk', '.gov.uk', '.edu.au'
];

/**
 * Configuração de rate limiting para APIs
 */
export const RATE_LIMIT_CONFIG = {
  phishTank: {
    requestsPerMinute: 300,
    requestsPerHour: 10000
  },
  virusTotal: {
    requestsPerMinute: 4, // API pública tem limite baixo
    requestsPerDay: 1000
  }
};
