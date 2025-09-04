// Teste simples para o LexicalAnalyzer
const punycode = require('punycode');

// Simulação da função de análise
function testPunycodeAnalysis() {
  const testUrls = [
    'https://xn--ggl-tdd6ba.com/', // Exemplo que você mencionou
    'https://google.com/',
    'https://xn--n3h.com/', // ☃.com (boneco de neve)
    'https://xn--fsq.xn--0zwm56d', // 中国
    'https://аррӏе.com/', // Apple com caracteres cirílicos
  ];

  console.log('=== Teste de Análise Punycode ===\n');

  testUrls.forEach(url => {
    console.log(`URL: ${url}`);
    
    try {
      let domain = new URL(url).hostname;
      console.log(`Domínio: ${domain}`);
      
      if (domain.includes('xn--')) {
        const decoded = punycode.toUnicode(domain);
        console.log(`Decodificado: ${decoded}`);
        
        // Verificar se é válido
        const reencoded = punycode.toASCII(decoded);
        console.log(`Re-codificado: ${reencoded}`);
        console.log(`Válido: ${reencoded.toLowerCase() === domain.toLowerCase()}`);
      }
      
    } catch (error) {
      console.log(`Erro: ${error.message}`);
    }
    
    console.log('---\n');
  });
}

testPunycodeAnalysis();
