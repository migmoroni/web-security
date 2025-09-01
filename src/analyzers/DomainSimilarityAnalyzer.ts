import { SecurityIssue } from '../types';
import { DomainUtils } from '../utils/DomainUtils';
import legitimateSites from '../data/legitimate-sites.json';

export interface DomainSimilarityResult {
  suspiciousSite: string;
  legitimateSite: string;
  similarity: number;
  differences: string[];
}

export class DomainSimilarityAnalyzer {
  private legitimateSitesMap: Map<string, string[]>;

  constructor() {
    this.legitimateSitesMap = new Map();
    // Organizar sites por primeira letra para busca otimizada
    Object.entries(legitimateSites).forEach(([letter, sites]) => {
      this.legitimateSitesMap.set(letter, sites);
    });
  }

  /**
   * Analisa se um domínio é similar a sites legítimos conhecidos
   */
  async analyze(domain: string): Promise<SecurityIssue[]> {
    // Usar utilitário para extrair domínio principal
    const mainDomain = DomainUtils.extractMainDomain(domain);
    const issues: SecurityIssue[] = [];
    
    // Se não é um domínio válido, não analisar
    if (!DomainUtils.isValidDomain(mainDomain)) {
      return issues;
    }
    
    // Se é um domínio conhecido como legítimo, não analisar
    if (DomainUtils.isKnownDomain(mainDomain)) {
      return issues;
    }
    
    // Buscar sites similares
    const similarSites = this.findSimilarSites(mainDomain);
    
    if (similarSites.length > 0) {
      const mostSimilar = similarSites[0];
      
      // Se a similaridade é muito alta mas não é exatamente igual
      if (mostSimilar.similarity > 0.7 && mostSimilar.site !== mainDomain) {
        const differences = this.findDifferences(mainDomain, mostSimilar.site);
        
        issues.push({
          type: 'domain-similarity',
          severity: mostSimilar.similarity > 0.9 ? 'high' : 'medium',
          description: `Domínio muito similar ao site legítimo "${mostSimilar.site}"`,
          details: `Domínio analisado: "${mainDomain}" (extraído de "${domain}"). Similaridade: ${(mostSimilar.similarity * 100).toFixed(1)}%. Diferenças: ${differences.join(', ')}`
        });
      }
    }

    return issues;
  }

  /**
   * Busca sites similares na base de dados legítimos
   */
  private findSimilarSites(domain: string): Array<{ site: string; similarity: number }> {
    const firstLetter = domain.charAt(0);
    const sitesToCheck = this.legitimateSitesMap.get(firstLetter) || [];
    
    // Também verificar letras adjacentes para casos como 0/o, 1/l, etc.
    const adjacentLetters = this.getAdjacentLetters(firstLetter);
    adjacentLetters.forEach(letter => {
      const sites = this.legitimateSitesMap.get(letter);
      if (sites) {
        sitesToCheck.push(...sites);
      }
    });

    const similarities = sitesToCheck.map(site => ({
      site,
      similarity: this.calculateSimilarity(domain, site)
    }));

    return similarities
      .filter(item => item.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Normaliza o domínio removendo protocolos, www, subdomínios e paths
   * Exemplo: "https://www.accounts.google.com/hkd/xyz?param=1" -> "google.com"
   */
  private normalizeDomain(domain: string): string {
    return DomainUtils.extractMainDomain(domain);
  }

  /**
   * Encontra similaridade suspeita com sites legítimos
   */
  private findSuspiciousSimilarity(domain: string): DomainSimilarityResult | null {
    const firstLetter = domain.charAt(0);
    const sitesToCheck = this.legitimateSitesMap.get(firstLetter) || [];
    
    // Também verificar letras adjacentes para casos como 0/o, 1/l, etc.
    const adjacentLetters = this.getAdjacentLetters(firstLetter);
    adjacentLetters.forEach(letter => {
      const sites = this.legitimateSitesMap.get(letter);
      if (sites) {
        sitesToCheck.push(...sites);
      }
    });

    for (const legitimateSite of sitesToCheck) {
      const similarity = this.calculateSimilarity(domain, legitimateSite);
      
      // Se a similaridade é alta mas não é exatamente o mesmo site
      if (similarity > 0.7 && similarity < 1.0 && domain !== legitimateSite) {
        const differences = this.findDifferences(domain, legitimateSite);
        
        // Se há poucas diferenças, é suspeito
        if (differences.length <= 3 && differences.length > 0) {
          return {
            suspiciousSite: domain,
            legitimateSite,
            similarity,
            differences
          };
        }
      }
    }

    return null;
  }

  /**
   * Calcula similaridade entre dois domínios usando Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Encontra diferenças específicas entre dois domínios
   */
  private findDifferences(suspicious: string, legitimate: string): string[] {
    const differences: string[] = [];
    const maxLength = Math.max(suspicious.length, legitimate.length);

    for (let i = 0; i < maxLength; i++) {
      const susChar = suspicious[i] || '';
      const legChar = legitimate[i] || '';
      
      if (susChar !== legChar) {
        if (susChar && legChar) {
          differences.push(`Posição ${i + 1}: '${susChar}' ao invés de '${legChar}'`);
        } else if (susChar) {
          differences.push(`Caractere extra: '${susChar}' na posição ${i + 1}`);
        } else {
          differences.push(`Caractere ausente: '${legChar}' na posição ${i + 1}`);
        }
      }
    }

    return differences;
  }

  /**
   * Obtém letras adjacentes para verificação (caracteres similares visualmente)
   */
  private getAdjacentLetters(letter: string): string[] {
    const similarChars: { [key: string]: string[] } = {
      'o': ['0'],
      '0': ['o'],
      'l': ['1', 'i'],
      '1': ['l', 'i'],
      'i': ['1', 'l'],
      'e': ['3'],
      '3': ['e'],
      'a': ['@'],
      '@': ['a'],
      's': ['5', '$'],
      '5': ['s'],
      '$': ['s']
    };

    return similarChars[letter] || [];
  }

  /**
   * Gera análise detalhada da similaridade
   */
  private generateSimilarityAnalysis(result: DomainSimilarityResult): string {
    const percentage = Math.round(result.similarity * 100);
    
    let analysis = `O domínio "${result.suspiciousSite}" tem ${percentage}% de similaridade com "${result.legitimateSite}". `;
    
    if (result.differences.length > 0) {
      analysis += `Diferenças encontradas: ${result.differences.join(', ')}.`;
    }
    
    return analysis;
  }

  /**
   * Retorna lista de sites verificados para transparência
   */
  private getCheckedSites(domain: string): string[] {
    const firstLetter = domain.charAt(0);
    const sites = this.legitimateSitesMap.get(firstLetter) || [];
    const adjacentLetters = this.getAdjacentLetters(firstLetter);
    
    adjacentLetters.forEach(letter => {
      const adjacentSites = this.legitimateSitesMap.get(letter);
      if (adjacentSites) {
        sites.push(...adjacentSites);
      }
    });
    
    return sites;
  }
}
