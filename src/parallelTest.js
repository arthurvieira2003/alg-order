const fs = require("fs");
const { performance } = require("perf_hooks");
const { generateRandomData } = require("./generator");
const SortContext = require("./SortContext");
const { setupTracing } = require("./tracing");

// Importando estratégias específicas para teste
const QuickSort = require("./strategies/QuickSort");
const MergeSort = require("./strategies/MergeSort");
const ParallelQuickSort = require("./strategies/ParallelQuickSort");
const ParallelMergeSort = require("./strategies/ParallelMergeSort");
const ParallelQuickSortPooled = require("./strategies/ParallelQuickSortPooled");
const ParallelMergeSortPooled = require("./strategies/ParallelMergeSortPooled");
const MultiprocessingSort = require("./strategies/MultiprocessingSort");

// Configurando tracer
const tracer = setupTracing("algoritmos-ordenacao-paralelos");

/**
 * Função para testar e comparar os algoritmos sequenciais e paralelos
 * @param {Array} data - Array a ser ordenado
 * @param {number} repeatCount - Número de repetições para cada algoritmo
 */
async function testParallelVsSequential(data, repeatCount = 3) {
  console.log(`\n===== COMPARANDO ALGORITMOS SEQUENCIAIS VS PARALELOS =====`);
  console.log(`Tamanho do array: ${data.length} elementos`);
  console.log(`Repetições: ${repeatCount}`);

  // Lista de grupos de algoritmos para comparação
  const algorithmGroups = [
    {
      name: "Quick Sort",
      algorithms: [
        { name: "Sequential", instance: new QuickSort() },
        { name: "Parallel", instance: new ParallelQuickSort() },
        { name: "Parallel Pooled", instance: new ParallelQuickSortPooled() },
      ],
    },
    {
      name: "Merge Sort",
      algorithms: [
        { name: "Sequential", instance: new MergeSort() },
        { name: "Parallel", instance: new ParallelMergeSort() },
        { name: "Parallel Pooled", instance: new ParallelMergeSortPooled() },
      ],
    },
    {
      name: "Multiprocessing",
      algorithms: [
        { name: "Sequential", instance: new MergeSort() },
        { name: "Multiprocessing", instance: new MultiprocessingSort() },
      ],
    },
  ];

  // Resultados para todos os algoritmos
  const results = [];

  // Testa cada grupo de algoritmos
  for (const group of algorithmGroups) {
    console.log(`\n----- ${group.name} Comparison -----`);

    const groupResults = {
      algorithmName: group.name,
      variants: [],
    };

    // Referência para o tempo do algoritmo sequencial (para cálculo do speedup)
    let sequentialTime = 0;

    // Testa cada variante do algoritmo
    for (const algorithm of group.algorithms) {
      const context = new SortContext(algorithm.instance, tracer);

      console.log(`Executando ${algorithm.name}...`);

      try {
        let totalTime = 0;
        let totalComparisons = 0;
        let totalSwaps = 0;

        for (let i = 0; i < repeatCount; i++) {
          console.log(`  Repetição ${i + 1}/${repeatCount}`);

          const clonedData = [...data]; // Clona os dados para cada repetição
          const result = await context.executeStrategy(clonedData);

          totalTime += result.stats.executionTime;
          totalComparisons += result.stats.comparisons;
          totalSwaps += result.stats.swaps;

          console.log(`    Tempo: ${result.stats.executionTime.toFixed(2)}ms`);
        }

        const avgTime = totalTime / repeatCount;
        const avgComparisons = totalComparisons / repeatCount;
        const avgSwaps = totalSwaps / repeatCount;

        // Para o algoritmo sequencial, armazena o tempo médio
        if (algorithm.name === "Sequential") {
          sequentialTime = avgTime;
        }

        const speedup =
          algorithm.name !== "Sequential" && sequentialTime > 0
            ? sequentialTime / avgTime
            : 1.0;

        const variantResult = {
          variant: algorithm.name,
          stats: {
            executionTime: avgTime,
            comparisons: avgComparisons,
            swaps: avgSwaps,
          },
          speedup: speedup,
        };

        groupResults.variants.push(variantResult);

        console.log(`  Média: ${avgTime.toFixed(2)}ms`);
        if (algorithm.name !== "Sequential") {
          console.log(`  Speedup: ${speedup.toFixed(2)}x`);
        }
      } catch (error) {
        console.error(`  Erro ao executar ${algorithm.name}: ${error.message}`);
      }
    }

    results.push(groupResults);
  }

  return results;
}

/**
 * Salva os resultados da comparação em um arquivo JSON
 * @param {Array} results - Resultados da comparação
 * @param {string} filename - Nome do arquivo
 */
function saveComparisonResults(results, filename) {
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
}

/**
 * Função principal para executar os testes
 */
async function main() {
  try {
    // Definindo tamanhos para teste
    const sizes = [100000, 500000, 1000000];

    for (const size of sizes) {
      const dataFile = `src/dados_paralelo_${size}.txt`;

      // Verifica se o arquivo existe, caso contrário gera os dados
      if (!fs.existsSync(dataFile)) {
        console.log(`\nGerando dados aleatórios com ${size} números...`);
        generateRandomData(size, 0, 10000, dataFile);
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

      // Executa os testes de comparação
      const results = await testParallelVsSequential(data, 3);

      // Salva os resultados
      const resultFile = `resultados_paralelo_${size}.json`;
      saveComparisonResults(results, resultFile);
      console.log(`\nResultados salvos em ${resultFile}`);
    }
  } catch (error) {
    console.error(`Erro no teste de paralelismo: ${error.message}`);
  }
}

// Executa a função principal
main().catch(console.error);
