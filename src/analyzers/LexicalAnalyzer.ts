import { LexicalAnalysisResult, SuspiciousCharacter } from '@/types';
import { PunycodeConverter } from '@/utils/PunycodeConverter';

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
    let originalDomain: string;
    
    try {
      const urlObj = new URL(url);
      originalDomain = urlObj.hostname;
      domain = urlObj.hostname;
    } catch {
      originalDomain = url;
      domain = url; // Se não for URL válida, analisa o texto completo
    }

    // Detectar se é punycode e converter para Unicode (otimizado)
    // Faz validação e decodificação em uma única operação para evitar dupla conversão
    let isPunycode = false;
    let isValidPunycode = true;
    
    try {
      if (domain.includes('xn--')) {
        isPunycode = true;
        const punycodeResult = this.isPunycodeValid(domain);
        isValidPunycode = punycodeResult.isValid;
        if (isValidPunycode) {
          domain = punycodeResult.decoded;
        }
      }
    } catch (error) {
      // Se falhar na conversão, manter o domínio original
      console.warn('Erro ao converter punycode:', error);
      domain = originalDomain;
      isValidPunycode = false;
    }

    const scripts = new Set<string>();
    const suspiciousChars: SuspiciousCharacter[] = [];

    // Analisar cada caractere do domínio decodificado
    for (let i = 0; i < domain.length; i++) {
      const char = domain[i];
      
      // Pular caracteres especiais comuns em URLs (pontos, hífens, etc.)
      if (/[.\-_0-9]/.test(char)) continue;

      const script = this.detectScript(char);
      
      if (script) {
        scripts.add(script);
      }

      // Detectar caracteres potencialmente confusos apenas se não for Latino
      if (this.isSuspiciousCharacter(char) && script !== 'Latino') {
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

    // Gerar explicação mais precisa
    let explanation = '';
    
    if (isPunycode && !isValidPunycode) {
      explanation = `ALERTA: Punycode inválido detectado em ${originalDomain}. `;
      explanation += 'Isso pode indicar tentativa de phishing ou erro de codificação.';
    } else if (isPunycode) {
      explanation = `Domínio internacional (IDN): ${originalDomain} → ${domain}. `;
    }

    if (hasMixedScripts) {
      explanation += `Mistura de scripts detectada: ${scriptsArray.join(', ')}. `;
      explanation += 'URLs legítimas raramente misturam diferentes sistemas de escrita.';
    } else if (suspiciousChars.length > 0) {
      explanation += `Caracteres potencialmente confusos detectados: ${suspiciousChars.map(c => c.char).join(', ')}. `;
      explanation += 'Estes caracteres podem ser usados para imitar domínios latinos.';
    } else {
      const mainScript = scriptsArray.length > 0 ? scriptsArray[0] : 'Latino';
      explanation += `Domínio usa apenas caracteres ${mainScript}. `;
      if (isPunycode && isValidPunycode) {
        explanation += 'IDN legítimo detectado.';
      } else {
        explanation += 'Nenhuma anomalia léxica detectada.';
      }
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
   * Verifica se um domínio contém apenas punycode válido
   * Retorna objeto com validação e domínio decodificado para otimização
   */
  private static isPunycodeValid(domain: string): { isValid: boolean; decoded: string } {
    try {
      // Se contém xn-- mas a conversão falha, é inválido
      if (domain.includes('xn--')) {
        const decoded = PunycodeConverter.toUnicode(domain);
        const encoded = PunycodeConverter.toASCII(decoded);
        const isValid = encoded.toLowerCase() === domain.toLowerCase();
        return { isValid, decoded };
      }
      return { isValid: true, decoded: domain };
    } catch {
      return { isValid: false, decoded: domain };
    }
  }

  /**
   * Verifica se um caractere é potencialmente suspeito
   * Foca em caracteres que podem ser confundidos com latinos
   */
  private static isSuspiciousCharacter(char: string): boolean {
    const code = char.charCodeAt(0);
    
    // Mapeamento de caracteres confusos com seus equivalentes latinos
    const confusingChars = new Map([
      // Cirílico que se parece com latino
      [0x0430, 'a'], // а → a
      [0x043E, 'o'], // о → o
      [0x0440, 'p'], // р → p
      [0x0435, 'e'], // е → e
      [0x0445, 'x'], // х → x
      [0x0441, 'c'], // с → c
      [0x0442, 't'], // т → t
      [0x043A, 'k'], // к → k
      [0x043C, 'm'], // м → m
      [0x043D, 'n'], // н → n
      [0x0443, 'y'], // у → y
      [0x0432, 'v'], // в → v
      [0x0437, '3'], // з → 3
      
      // Grego que se parece com latino
      [0x03B1, 'a'], // α → a
      [0x03BF, 'o'], // ο → o
      [0x03C1, 'p'], // ρ → p
      [0x03B5, 'e'], // ε → e
      [0x03C5, 'u'], // υ → u
      [0x03B9, 'i'], // ι → i
      [0x03BA, 'k'], // κ → k
      [0x03BD, 'v'], // ν → v
      [0x03C7, 'x'], // χ → x
      
      // Outros caracteres potencialmente confusos
      [0x04BB, 'h'], // һ → h (cirílico h)
      [0x0501, 'd'], // ԁ → d (cirílico d)
    ]);

    return confusingChars.has(code);
  }
}
