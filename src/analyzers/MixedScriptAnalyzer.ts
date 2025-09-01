import { SecurityIssue } from '../types';
import { DomainUtils } from '../utils/DomainUtils';

export interface MixedScriptResult {
  hasMixedScripts: boolean;
  scripts: string[];
  suspiciousChars: {
    char: string;
    script: string;
    position: number;
    expected: string;
  }[];
}

export class MixedScriptAnalyzer {
  private scriptRanges: { [key: string]: RegExp } = {
    latin: /[\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]/,
    cyrillic: /[\u0400-\u04FF\u0500-\u052F]/,
    greek: /[\u0370-\u03FF]/,
    arabic: /[\u0600-\u06FF\u0750-\u077F]/,
    hebrew: /[\u0590-\u05FF]/,
    chinese: /[\u4E00-\u9FFF]/,
    japanese: /[\u3040-\u309F\u30A0-\u30FF]/,
    korean: /[\uAC00-\uD7AF]/,
    thai: /[\u0E00-\u0E7F]/,
    devanagari: /[\u0900-\u097F]/
  };

  private homoglyphs: { [key: string]: string[] } = {
    'a': ['а', 'α', 'ɑ'], // cyrillic а, greek α, latin ɑ
    'e': ['е', 'ε'], // cyrillic е, greek ε
    'o': ['о', 'ο', '0'], // cyrillic о, greek ο, digit 0
    'p': ['р', 'ρ'], // cyrillic р, greek ρ
    'c': ['с', 'ϲ'], // cyrillic с, greek ϲ
    'x': ['х', 'χ'], // cyrillic х, greek χ
    'y': ['у', 'υ'], // cyrillic у, greek υ
    'h': ['һ'], // cyrillic һ
    'i': ['і', 'ι', '1'], // cyrillic і, greek ι, digit 1
    'j': ['ј'], // cyrillic ј
    'n': ['ո'], // armenian ո
    's': ['ѕ', '$'], // cyrillic ѕ, dollar
    'v': ['ν'], // greek ν
    'm': ['м'], // cyrillic м
    'k': ['κ'], // greek κ
    'l': ['1', 'ı'], // digit 1, dotless i
    'd': ['ԁ'], // cyrillic ԁ
    'g': ['ց'], // armenian ց
    'w': ['ԝ'], // cyrillic ԝ
    'u': ['υ'], // greek υ
    'b': ['Ь'], // cyrillic Ь
    't': ['т'], // cyrillic т
    'r': ['г'] // cyrillic г
  };

  /**
   * Analisa se um domínio contém mistura suspeita de alfabetos
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
    
    // Análise de scripts mistos
    const scriptResult = this.analyzeMixedScripts(mainDomain);
    
    if (scriptResult.hasMixedScripts) {
      issues.push({
        type: 'mixed-scripts',
        severity: 'high',
        description: 'Domínio contém mistura suspeita de alfabetos diferentes',
        details: `Domínio analisado: "${mainDomain}" (extraído de "${domain}"). ${this.generateMixedScriptAnalysis(scriptResult)}`
      });
    }

    // Análise de homóglifos
    const homoglyphResult = this.analyzeHomoglyphs(mainDomain);
    
    if (homoglyphResult.length > 0) {
      issues.push({
        type: 'homoglyph-attack',
        severity: 'high',
        description: 'Domínio contém caracteres que imitam letras latinas',
        details: `Domínio analisado: "${mainDomain}" (extraído de "${domain}"). ${this.generateHomoglyphAnalysis(homoglyphResult)}`
      });
    }

    return issues;
  }

  /**
   * Analisa mistura de scripts diferentes
   */
  private analyzeMixedScripts(domain: string): MixedScriptResult {
    const scripts = new Set<string>();
    const suspiciousChars: MixedScriptResult['suspiciousChars'] = [];

    for (let i = 0; i < domain.length; i++) {
      const char = domain[i];
      const script = this.getCharacterScript(char);
      
      if (script) {
        scripts.add(script);
        
        // Se não é latim em um domínio que deveria ser predominantemente latim
        if (script !== 'latin' && this.isDomainExpectedToBeLatin(domain)) {
          const expectedChar = this.findLatinEquivalent(char);
          suspiciousChars.push({
            char,
            script,
            position: i,
            expected: expectedChar || char
          });
        }
      }
    }

    return {
      hasMixedScripts: scripts.size > 1,
      scripts: Array.from(scripts),
      suspiciousChars
    };
  }

  /**
   * Analisa homóglifos (caracteres visualmente similares)
   */
  private analyzeHomoglyphs(domain: string): Array<{char: string, position: number, alternatives: string[]}> {
    const homoglyphs: Array<{char: string, position: number, alternatives: string[]}> = [];

    for (let i = 0; i < domain.length; i++) {
      const char = domain[i];
      
      // Verificar se o caractere tem alternativas homóglifas
      for (const [latin, alternatives] of Object.entries(this.homoglyphs)) {
        if (alternatives.includes(char)) {
          homoglyphs.push({
            char,
            position: i,
            alternatives: [latin, ...alternatives.filter(alt => alt !== char)]
          });
        }
      }
    }

    return homoglyphs;
  }

  /**
   * Determina o script de um caractere
   */
  private getCharacterScript(char: string): string | null {
    for (const [script, regex] of Object.entries(this.scriptRanges)) {
      if (regex.test(char)) {
        return script;
      }
    }
    return null;
  }

  /**
   * Verifica se o domínio deveria ser predominantemente latino
   */
  private isDomainExpectedToBeLatin(domain: string): boolean {
    // A maioria dos domínios comerciais são latinos
    // Se contém TLD comum (.com, .org, etc.), espera-se que seja latino
    return /\.(com|org|net|edu|gov|mil|br|us|uk|de|fr|it|es|jp|cn)$/.test(domain);
  }

  /**
   * Encontra equivalente latino para um caractere
   */
  private findLatinEquivalent(char: string): string | null {
    for (const [latin, alternatives] of Object.entries(this.homoglyphs)) {
      if (alternatives.includes(char)) {
        return latin;
      }
    }
    return null;
  }

  /**
   * Gera análise detalhada de scripts mistos
   */
  private generateMixedScriptAnalysis(result: MixedScriptResult): string {
    let analysis = `Detectados ${result.scripts.length} alfabetos diferentes: ${result.scripts.join(', ')}. `;
    
    if (result.suspiciousChars.length > 0) {
      analysis += `Caracteres suspeitos: `;
      result.suspiciousChars.forEach((char, index) => {
        analysis += `'${char.char}' (${char.script}) na posição ${char.position + 1}`;
        if (char.expected !== char.char) {
          analysis += ` deveria ser '${char.expected}'`;
        }
        if (index < result.suspiciousChars.length - 1) {
          analysis += ', ';
        }
      });
    }
    
    return analysis;
  }

  /**
   * Gera análise de homóglifos
   */
  private generateHomoglyphAnalysis(homoglyphs: Array<{char: string, position: number, alternatives: string[]}>): string {
    let analysis = 'Caracteres que imitam letras latinas encontrados: ';
    
    homoglyphs.forEach((item, index) => {
      analysis += `'${item.char}' na posição ${item.position + 1} (pode ser confundido com: ${item.alternatives.join(', ')})`;
      if (index < homoglyphs.length - 1) {
        analysis += ', ';
      }
    });
    
    return analysis;
  }
}
