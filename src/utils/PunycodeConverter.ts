/**
 * Implementação nativa de Punycode para uso em extensões de navegador
 * Baseada na especificação RFC 3492
 */

export class PunycodeConverter {
  private static readonly BASE = 36;
  private static readonly TMIN = 1;
  private static readonly TMAX = 26;
  private static readonly SKEW = 38;
  private static readonly DAMP = 700;
  private static readonly INITIAL_BIAS = 72;
  private static readonly INITIAL_N = 128;
  private static readonly DELIMITER = '-';

  /**
   * Converte punycode para Unicode
   */
  static toUnicode(input: string): string {
    if (!input.includes('xn--')) {
      return input;
    }

    return input.split('.').map(label => {
      if (label.startsWith('xn--')) {
        return this.decode(label.slice(4));
      }
      return label;
    }).join('.');
  }

  /**
   * Converte Unicode para punycode  
   */
  static toASCII(input: string): string {
    return input.split('.').map(label => {
      if (this.needsEncoding(label)) {
        return 'xn--' + this.encode(label);
      }
      return label;
    }).join('.');
  }

  /**
   * Verifica se um label precisa de codificação punycode
   */
  private static needsEncoding(label: string): boolean {
    for (let i = 0; i < label.length; i++) {
      if (label.charCodeAt(i) > 127) {
        return true;
      }
    }
    return false;
  }

  /**
   * Decodifica punycode para Unicode
   */
  private static decode(input: string): string {
    let n = this.INITIAL_N;
    let i = 0;
    let bias = this.INITIAL_BIAS;
    
    // Separar parte ASCII da parte codificada
    let delimiterIndex = input.lastIndexOf(this.DELIMITER);
    let output: number[] = [];
    
    if (delimiterIndex >= 0) {
      // Há parte ASCII básica
      let basic = input.slice(0, delimiterIndex);
      for (let j = 0; j < basic.length; j++) {
        let code = basic.charCodeAt(j);
        if (code >= 128) {
          throw new Error('Invalid input');
        }
        output.push(code);
      }
      input = input.slice(delimiterIndex + 1);
    }

    let inputLength = input.length;
    let inputIndex = 0;
    
    while (inputIndex < inputLength) {
      let oldi = i;
      let w = 1;
      
      for (let k = this.BASE; ; k += this.BASE) {
        if (inputIndex >= inputLength) {
          throw new Error('Invalid input');
        }
        
        let digit = this.digitToBasic(input.charCodeAt(inputIndex++));
        if (digit >= this.BASE) {
          throw new Error('Invalid input');
        }
        
        i += digit * w;
        let t = k <= bias ? this.TMIN : (k >= bias + this.TMAX ? this.TMAX : k - bias);
        
        if (digit < t) {
          break;
        }
        
        w *= this.BASE - t;
      }
      
      bias = this.adapt(i - oldi, output.length + 1, oldi === 0);
      n += Math.floor(i / (output.length + 1));
      i %= output.length + 1;
      
      output.splice(i, 0, n);
      i++;
    }
    
    return String.fromCharCode(...output);
  }

  /**
   * Codifica Unicode para punycode
   */
  private static encode(input: string): string {
    let n = this.INITIAL_N;
    let delta = 0;
    let bias = this.INITIAL_BIAS;
    
    let output = '';
    let basicLength = 0;
    
    // Extrair caracteres básicos (ASCII)
    for (let i = 0; i < input.length; i++) {
      let code = input.charCodeAt(i);
      if (code < 128) {
        output += String.fromCharCode(code);
        basicLength++;
      }
    }
    
    let handled = basicLength;
    if (basicLength > 0) {
      output += this.DELIMITER;
    }
    
    while (handled < input.length) {
      let min = Number.MAX_SAFE_INTEGER;
      
      // Encontrar o próximo caractere não-básico
      for (let i = 0; i < input.length; i++) {
        let code = input.charCodeAt(i);
        if (code >= n && code < min) {
          min = code;
        }
      }
      
      delta += (min - n) * (handled + 1);
      n = min;
      
      for (let i = 0; i < input.length; i++) {
        let code = input.charCodeAt(i);
        
        if (code < n) {
          delta++;
        } else if (code === n) {
          let q = delta;
          for (let k = this.BASE; ; k += this.BASE) {
            let t = k <= bias ? this.TMIN : (k >= bias + this.TMAX ? this.TMAX : k - bias);
            if (q < t) {
              break;
            }
            output += String.fromCharCode(this.basicToDigit(t + (q - t) % (this.BASE - t)));
            q = Math.floor((q - t) / (this.BASE - t));
          }
          
          output += String.fromCharCode(this.basicToDigit(q));
          bias = this.adapt(delta, handled + 1, handled === basicLength);
          delta = 0;
          handled++;
        }
      }
      
      delta++;
      n++;
    }
    
    return output;
  }

  /**
   * Adapta o bias
   */
  private static adapt(delta: number, numPoints: number, firstTime: boolean): number {
    delta = firstTime ? Math.floor(delta / this.DAMP) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    
    let k = 0;
    while (delta > Math.floor(((this.BASE - this.TMIN) * this.TMAX) / 2)) {
      delta = Math.floor(delta / (this.BASE - this.TMIN));
      k += this.BASE;
    }
    
    return Math.floor(k + (this.BASE - this.TMIN + 1) * delta / (delta + this.SKEW));
  }

  /**
   * Converte dígito para caractere básico
   */
  private static basicToDigit(digit: number): number {
    return digit + 22 + 75 * (digit < 26 ? 1 : 0);
  }

  /**
   * Converte caractere básico para dígito
   */
  private static digitToBasic(code: number): number {
    if (code - 48 < 10) {
      return code - 22;
    }
    if (code - 65 < 26) {
      return code - 65;
    }
    if (code - 97 < 26) {
      return code - 97;
    }
    return this.BASE;
  }
}
