// Teste específico para o LexicalAnalyzer
const punycode = require('punycode');

// Simulação dos SCRIPT_RANGES
const SCRIPT_RANGES = {
  'Latino': /[\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/,
  'Cirílico': /[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/,
  'Chinês': /[\u4E00-\u9FFF\u3400-\u4DBF]/,
};

function detectScript(char) {
  for (const [script, regex] of Object.entries(SCRIPT_RANGES)) {
    if (regex.test(char)) {
      return script;
    }
  }
  return null;
}

function analyzeTestUrl(url) {
  console.log(`\n=== Analisando: ${url} ===`);
  
  let domain, originalDomain;
  try {
    const urlObj = new URL(url);
    originalDomain = urlObj.hostname;
    domain = urlObj.hostname;
  } catch {
    originalDomain = url;
    domain = url;
  }

  console.log(`Domínio original: ${originalDomain}`);

  let isPunycode = false;
  if (domain.includes('xn--')) {
    isPunycode = true;
    domain = punycode.toUnicode(domain);
    console.log(`Decodificado: ${domain}`);
  }

  const scripts = new Set();
  
  for (let i = 0; i < domain.length; i++) {
    const char = domain[i];
    if (/[.\-_0-9]/.test(char)) continue;

    const script = detectScript(char);
    if (script) {
      scripts.add(script);
      console.log(`Char '${char}' → ${script}`);
    }
  }

  const scriptsArray = Array.from(scripts);
  const hasMixedScripts = scriptsArray.length > 1;

  console.log(`Scripts encontrados: ${scriptsArray.join(', ')}`);
  console.log(`Mistura de scripts: ${hasMixedScripts}`);
  console.log(`É punycode: ${isPunycode}`);
  
  // Conclusão
  if (hasMixedScripts) {
    console.log('🚨 SUSPEITO: Mistura de scripts detectada');
  } else if (isPunycode) {
    console.log('✅ IDN legítimo (punycode válido)');
  } else {
    console.log('✅ Normal');
  }
}

// Testes
analyzeTestUrl('https://xn--ggl-tdd6ba.com/');
analyzeTestUrl('https://google.com/');
analyzeTestUrl('https://xn--n3h.com/');
analyzeTestUrl('https://xn--fsq.xn--0zwm56d');
analyzeTestUrl('https://аррӏе.com/'); // Já em unicode, mistura scripts?
