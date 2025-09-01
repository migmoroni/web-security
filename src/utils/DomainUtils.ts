/**
 * Utilitários para análise e extração de domínios
 */

export class DomainUtils {
  private static compositeTlds = [
    'com.br', 'com.ar', 'com.mx', 'com.au', 'co.uk', 'co.jp', 
    'co.kr', 'co.za', 'com.sg', 'com.my', 'org.br', 'net.br',
    'gov.br', 'edu.br', 'mil.br', 'ac.uk', 'org.uk', 'gov.uk',
    'co.in', 'net.in', 'org.in', 'gov.in', 'ac.in'
  ];

  /**
   * Extrai o domínio principal de uma URL completa, removendo:
   * - Protocolos (http://, https://)
   * - Subdomínios (www., accounts., mail., etc.)
   * - Paths (/hkd/xyz, /login, etc.)
   * - Query parameters (?param=value)
   * - Fragments (#section)
   * 
   * Exemplos:
   * "https://accounts.google.com/hkd/xyz?param=1#section" -> "google.com"
   * "mail.yahoo.com/inbox" -> "yahoo.com"
   * "www.site.com.br/page" -> "site.com.br"
   * "subdomain.domain.co.uk" -> "domain.co.uk"
   */
  static extractMainDomain(input: string): string {
    let cleanDomain = input.toLowerCase().trim();
    
    // Remover protocolo
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
    
    // Remover www se presente
    cleanDomain = cleanDomain.replace(/^www\./, '');
    
    // Remover path, query parameters e fragments
    cleanDomain = cleanDomain.split('/')[0].split('?')[0].split('#')[0];
    
    // Remover porta se presente
    cleanDomain = cleanDomain.split(':')[0];
    
    // Dividir por pontos
    const parts = cleanDomain.split('.');
    
    // Se não tem pontos, retornar como está
    if (parts.length < 2) {
      return cleanDomain;
    }
    
    // Verificar se tem TLD composto
    const lastTwoParts = parts.slice(-2).join('.');
    
    if (this.compositeTlds.includes(lastTwoParts)) {
      // Para TLDs compostos, pegar 3 partes: domain.com.br
      return parts.slice(-3).join('.');
    }
    
    // Caso padrão: pegar apenas as últimas 2 partes (domain.com)
    return lastTwoParts;
  }

  /**
   * Verifica se um domínio é considerado legítimo/conhecido
   */
  static isKnownDomain(domain: string): boolean {
    const mainDomain = this.extractMainDomain(domain);
    
    // Lista de domínios claramente legítimos
    const knownDomains = [
      'google.com', 'youtube.com', 'gmail.com',
      'facebook.com', 'instagram.com', 'whatsapp.com',
      'amazon.com', 'microsoft.com', 'apple.com',
      'netflix.com', 'spotify.com', 'paypal.com',
      'github.com', 'stackoverflow.com', 'reddit.com',
      'wikipedia.org', 'twitter.com', 'linkedin.com'
    ];
    
    return knownDomains.includes(mainDomain);
  }

  /**
   * Normaliza URL para análise consistente
   */
  static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return this.extractMainDomain(urlObj.hostname);
    } catch {
      // Se não conseguir parsear como URL, tratar como domínio
      return this.extractMainDomain(url);
    }
  }

  /**
   * Valida se uma string parece ser um domínio válido
   */
  static isValidDomain(domain: string): boolean {
    const mainDomain = this.extractMainDomain(domain);
    
    // Verificações básicas
    if (!mainDomain || mainDomain.length < 3) return false;
    if (!mainDomain.includes('.')) return false;
    if (mainDomain.startsWith('.') || mainDomain.endsWith('.')) return false;
    
    // Regex para formato básico de domínio
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
    
    return domainRegex.test(mainDomain);
  }
}
