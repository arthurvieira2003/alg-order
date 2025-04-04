const fs = require("fs");
const { performance } = require("perf_hooks");
const { generateRandomData } = require("./generator");
const SortContext = require("./SortContext");
const { setupTracing } = require("./tracing");

// Importando apenas as estratégias que queremos testar
const ParallelQuickSortPooled = require("./strategies/ParallelQuickSortPooled");
const ParallelMergeSortPooled = require("./strategies/ParallelMergeSortPooled");
const MultiprocessingSort = require("./strategies/MultiprocessingSort");

// Configurando tracer
const tracer = setupTracing("grandes-arrays-ordenacao");

/**
 * Função para testar os algoritmos paralelos em arrays grandes
 * @param {Array} data - Array a ser ordenado
 * @param {number} repeatCount - Número de repetições para cada algoritmo
 */
async function testLargeArrays(data, repeatCount = 3) {
  console.log(`\n===== TESTANDO ALGORITMOS EM ARRAY GRANDE =====`);
  console.log(`Tamanho do array: ${data.length} elementos`);
  console.log(`Repetições: ${repeatCount}`);

  // Lista de algoritmos para testar
  const algorithms = [
    {
      name: "Parallel Quick Sort (Pooled)",
      instance: new ParallelQuickSortPooled(),
    },
    {
      name: "Parallel Merge Sort (Pooled)",
      instance: new ParallelMergeSortPooled(),
    },
    {
      name: "Multiprocessing Sort",
      instance: new MultiprocessingSort(),
    },
  ];

  // Resultados para todos os algoritmos
  const results = [];

  // Testa cada algoritmo
  for (const algorithm of algorithms) {
    const context = new SortContext(algorithm.instance, tracer);

    // Resultados para o algoritmo atual
    const algorithmResult = {
      algorithmName: algorithm.name,
      stats: {
        executionTime: 0,
        comparisons: 0,
        swaps: 0,
      },
    };

    console.log(`\n----- ${algorithm.name} -----`);

    try {
      let totalTime = 0;
      let totalComparisons = 0;
      let totalSwaps = 0;

      for (let i = 0; i < repeatCount; i++) {
        console.log(`  Repetição ${i + 1}/${repeatCount}`);

        // Clona os dados para cada repetição
        const clonedData = [...data];

        // Marca o tempo inicial
        const startTime = performance.now();

        // Executa o algoritmo
        const result = await context.executeStrategy(clonedData);

        // Marca o tempo final
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        totalTime += executionTime;
        totalComparisons += result.stats.comparisons;
        totalSwaps += result.stats.swaps;

        console.log(`    Tempo: ${executionTime.toFixed(2)}ms`);
        console.log(
          `    Array ordenado corretamente: ${validateSorting(
            result.sortedArray
          )}`
        );
      }

      // Calcula médias
      algorithmResult.stats = {
        executionTime: totalTime / repeatCount,
        comparisons: totalComparisons / repeatCount,
        swaps: totalSwaps / repeatCount,
      };

      console.log(
        `  Média de tempo: ${algorithmResult.stats.executionTime.toFixed(2)}ms`
      );
      console.log(
        `  Média de comparações: ${algorithmResult.stats.comparisons.toFixed(
          0
        )}`
      );
      console.log(
        `  Média de trocas: ${algorithmResult.stats.swaps.toFixed(0)}`
      );

      results.push(algorithmResult);
    } catch (error) {
      console.error(`  Erro ao executar ${algorithm.name}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Valida se o array está ordenado corretamente
 * @param {Array} array - Array a ser validado
 * @returns {boolean} - Verdadeiro se estiver ordenado, falso caso contrário
 */
function validateSorting(array) {
  for (let i = 1; i < array.length; i++) {
    if (array[i] < array[i - 1]) {
      return false;
    }
  }
  return true;
}

/**
 * Salva os resultados em um arquivo JSON
 * @param {Array} results - Resultados a serem salvos
 * @param {string} filename - Nome do arquivo
 */
function saveResults(results, filename) {
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
}

/**
 * Função principal para executar os testes
 */
async function main() {
  try {
    // Definindo tamanhos para teste
    const sizes = [1000000, 5000000, 10000000];

    for (const size of sizes) {
      const dataFile = `src/dados_grande_${size}.txt`;

      // Verifica se o arquivo existe, caso contrário gera os dados
      if (!fs.existsSync(dataFile)) {
        console.log(`\nGerando dados aleatórios com ${size} números...`);
        generateRandomData(size, 0, 1000000, dataFile);
        console.log(`Dados gerados e salvos em ${dataFile}`);
      }

      // Lê os dados do arquivo
      console.log(`\nCarregando dados de ${dataFile}...`);
      const data = fs
        .readFileSync(dataFile, "utf8")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map(Number);
      console.log(`Total de ${data.length} números carregados.`);

      // Executa os testes
      const results = await testLargeArrays(data, 3);

      // Salva os resultados
      const resultFile = `resultados_grande_${size}.json`;
      saveResults(results, resultFile);
      console.log(`\nResultados salvos em ${resultFile}`);
    }
  } catch (error) {
    console.error(`Erro no teste: ${error.message}`);
  }
}

// Executa a função principal
main().catch(console.error);
