const fs = require("fs");

/**
 * Gera um conjunto de números aleatórios e os salva em um arquivo
 * @param {number} size - Quantidade de números a serem gerados
 * @param {number} min - Valor mínimo dos números (padrão: 0)
 * @param {number} max - Valor máximo dos números (padrão: 10000)
 * @param {string} filename - Nome do arquivo onde os dados serão salvos
 */
function generateRandomData(size, min = 0, max = 10000, filename = "data.txt") {
  console.log(`Gerando ${size} números aleatórios entre ${min} e ${max}...`);

  // Cria um array com números aleatórios
  const numbers = Array.from(
    { length: size },
    () => Math.floor(Math.random() * (max - min + 1)) + min
  );

  // Salva os números no arquivo
  fs.writeFileSync(filename, numbers.join("\n"));

  console.log(`Dados gerados e salvos em ${filename}`);
  return filename;
}

module.exports = { generateRandomData };

// Se executado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const size = parseInt(args[0]) || 1000;
  const min = parseInt(args[1]) || 0;
  const max = parseInt(args[2]) || 10000;
  const filename = args[3] || "data.txt";

  generateRandomData(size, min, max, filename);
}
