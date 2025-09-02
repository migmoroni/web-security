import { LexicalAnalysisResult, SuspiciousCharacter } from '@/types';

/**
 * Analisador Léxico de URLs
 * Analisa a grafia das URLs quanto ao uso de conjuntos diferentes de caracteres Unicode
 */
export class LexicalAnalyzer {
  private static readonly SCRIPT_RANGES = {
    'Latino': /[\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/,
    'Cirílico': /[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/,
    'Grego': /[\u0370-\u03FF\u1F00-\u1FFF]/,
    'Árabe': /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/,
    'Chinês': /[\u4E00-\u9FFF\u3400-\u4DBF]/,
    'Japonês': /[\u3040-\u309F\u30A0-\u30FF]/,
    'Coreano': /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
    'Tailandês': /[\u0E00-\u0E7F]/,
    'Hebraico': /[\u0590-\u05FF]/,
  };

  /**
   * Analisa URL quanto à mistura de scripts Unicode
   * Retorna tipo 2 (suspeito) se há mistura, tipo 1 (não suspeito) se usa apenas um conjunto
   */
  static analyzeUrl(url: string): LexicalAnalysisResult {
    // Extrair apenas o domínio para análise
    let domain: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
    } catch {
      domain = url; // Se não for URL válida, analisa o texto completo
    }

    const scripts = new Set<string>();
    const suspiciousChars: SuspiciousCharacter[] = [];

    // Analisar cada caractere do domínio
    for (let i = 0; i < domain.length; i++) {
      const char = domain[i];
      
      // Pular caracteres especiais comuns em URLs (pontos, hífens, etc.)
      if (/[.\-_0-9]/.test(char)) continue;

      const script = this.detectScript(char);
      
      if (script) {
        scripts.add(script);
      }

      // Detectar caracteres potencialmente confusos
      if (this.isSuspiciousCharacter(char)) {
        suspiciousChars.push({
          char,
          script: script || 'Desconhecido',
          position: i,
          context: domain.substring(Math.max(0, i - 3), i + 4)
        });
      }
    }

    const scriptsArray = Array.from(scripts);
    const hasMixedScripts = scriptsArray.length > 1;

    // Gerar explicação
    let explanation = '';
    if (hasMixedScripts) {
      explanation = `Mistura de scripts detectada: ${scriptsArray.join(', ')}. `;
      explanation += 'URLs legítimas geralmente usam apenas um conjunto de caracteres.';
    } else if (suspiciousChars.length > 0) {
      explanation = `Caracteres potencialmente confusos detectados: ${suspiciousChars.map(c => c.char).join(', ')}. `;
      explanation += 'Estes caracteres podem ser usados para imitar outros domínios.';
    } else {
      explanation = `URL usa apenas caracteres ${scriptsArray.length > 0 ? scriptsArray[0] : 'padrão'}. Nenhuma anomalia léxica detectada.`;
    }

    return {
      hasMixedScripts,
      scripts: scriptsArray,
      suspiciousChars,
      explanation
    };
  }

  /**
   * Detecta qual script Unicode um caractere pertence
   */
  private static detectScript(char: string): string | null {
    for (const [script, regex] of Object.entries(this.SCRIPT_RANGES)) {
      if (regex.test(char)) {
        return script;
      }
    }
    return null;
  }

  /**
   * Verifica se um caractere é potencialmente suspeito
   */
  private static isSuspiciousCharacter(char: string): boolean {
    const code = char.charCodeAt(0);
    
    // Caracteres que podem ser confundidos com latinos
    const confusingChars = [
      0x0430, // а (cirílico a)
      0x043E, // о (cirílico o)
      0x0440, // р (cirílico p)
      0x0435, // е (cirílico e)
      0x0445, // х (cirílico x)
      0x0441, // с (cirílico c)
      0x03B1, // α (grego alpha)
      0x03BF, // ο (grego omicron)
      0x03C1, // ρ (grego rho)
    ];

    return confusingChars.includes(code);
  }
}
