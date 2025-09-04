// Teste específico para o PunycodeConverter
import { PunycodeConverter } from '../src/utils/PunycodeConverter';

console.log('🧪 Testando PunycodeConverter...');

const testCases = [
  'xn--ggl-tdd6ba.com', // Esperado: gооglе.com
  'xn--n3h.com', // Esperado: ☃.com
  'xn--fsq.xn--0zwm56d', // Esperado: 例.测试
  'normal.com', // Esperado: sem mudança
];

testCases.forEach(test => {
  console.log(`\n🔍 Testando: ${test}`);
  try {
    const decoded = PunycodeConverter.toUnicode(test);
    console.log(`✅ Decodificado: ${decoded}`);
    
    if (decoded !== test) {
      const reencoded = PunycodeConverter.toASCII(decoded);
      console.log(`🔄 Re-codificado: ${reencoded}`);
      console.log(`✓ Reversível: ${reencoded.toLowerCase() === test.toLowerCase()}`);
    }
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }
});

console.log('\n✅ Teste concluído!');
