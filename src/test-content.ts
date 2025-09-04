// Content script de teste simples
console.log('🚀 TESTE: Content script carregado!');

// Teste básico sem dependências
function testBasicFunctionality() {
  console.log('🧪 TESTE: Iniciando teste básico...');
  
  // Verificar se conseguimos acessar a página
  console.log('📄 TESTE: URL atual:', window.location.href);
  console.log('📄 TESTE: Título:', document.title);
  
  // Verificar se conseguimos encontrar links
  const links = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
  console.log(`🔗 TESTE: Encontrados ${links.length} links`);
  
  // Testar cada link
  links.forEach((link, index) => {
    if (index < 5) { // Apenas os primeiros 5 para não fazer spam
      console.log(`🔗 TESTE: Link ${index + 1}: ${link.href}`);
      
      // Aplicar estilo simples para teste
      link.style.border = '2px solid red';
      link.style.backgroundColor = 'yellow';
      
      console.log(`🎨 TESTE: Estilo aplicado ao link ${index + 1}`);
    }
  });
  
  console.log('✅ TESTE: Teste básico concluído');
}

// Executar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testBasicFunctionality);
} else {
  testBasicFunctionality();
}

// Testar também após um delay
setTimeout(() => {
  console.log('⏰ TESTE: Teste após 2 segundos...');
  testBasicFunctionality();
}, 2000);

console.log('🔚 TESTE: Content script finalizado!');
