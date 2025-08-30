import { UnicodeAnalysisResult, SuspiciousCharacter } from '@/types';

export class UnicodeAnalyzer {
  private static readonly SCRIPT_RANGES = {
    'Latin': /[\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/,
    'Cyrillic': /[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/,
    'Greek': /[\u0370-\u03FF\u1F00-\u1FFF]/,
    'Arabic': /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/,
    'Chinese': /[\u4E00-\u9FFF\u3400-\u4DBF]/,
    'Japanese': /[\u3040-\u309F\u30A0-\u30FF]/,
    'Korean': /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
    'Thai': /[\u0E00-\u0E7F]/,
    'Hebrew': /[\u0590-\u05FF]/,
  };

  static analyzeText(text: string): UnicodeAnalysisResult {
    const scripts = new Set<string>();
    const suspiciousChars: SuspiciousCharacter[] = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const script = this.detectScript(char);
      
      if (script) {
        scripts.add(script);
      }

      // Detectar caracteres que podem ser confundidos
      if (this.isSuspiciousCharacter(char)) {
        suspiciousChars.push({
          char,
          script: script || 'Unknown',
          position: i,
          context: text.substring(Math.max(0, i - 5), i + 6)
        });
      }
    }

    const scriptsArray = Array.from(scripts);
    const hasMixedScripts = scriptsArray.length > 1;

    return {
      hasMixedScripts,
      scripts: scriptsArray,
      suspiciousChars
    };
  }

  private static detectScript(char: string): string | null {
    for (const [script, regex] of Object.entries(this.SCRIPT_RANGES)) {
      if (regex.test(char)) {
        return script;
      }
    }
    return null;
  }

  private static isSuspiciousCharacter(char: string): boolean {
    // Caracteres que podem ser usados para spoofing
    const suspiciousChars = [
      '\u0430', // cyrillic 'a' que parece com latin 'a'
      '\u043e', // cyrillic 'o' que parece com latin 'o'
      '\u0440', // cyrillic 'p' que parece com latin 'p'
      '\u0435', // cyrillic 'e' que parece com latin 'e'
      '\u0440', // cyrillic 'p' que parece com latin 'p'
      '\u0441', // cyrillic 'c' que parece com latin 'c'
      '\u0445', // cyrillic 'x' que parece com latin 'x'
      '\u0443', // cyrillic 'y' que parece com latin 'y'
    ];

    return suspiciousChars.includes(char);
  }

  static generateSuspicionExplanation(analysis: UnicodeAnalysisResult): string {
    if (!analysis.hasMixedScripts && analysis.suspiciousChars.length === 0) {
      return '';
    }

    const explanations: string[] = [];

    if (analysis.hasMixedScripts) {
      explanations.push(
        `Este link contém caracteres de diferentes sistemas de escrita: ${analysis.scripts.join(', ')}. ` +
        'Isso pode indicar uma tentativa de spoofing de domínio.'
      );
    }

    if (analysis.suspiciousChars.length > 0) {
      explanations.push(
        `Foram encontrados ${analysis.suspiciousChars.length} caracteres suspeitos que podem ` +
        'ser usados para imitar caracteres latinos comuns.'
      );
    }

    return explanations.join(' ');
  }
}
