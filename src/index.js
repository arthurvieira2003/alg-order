const fs = require("fs");
const { generateRandomData } = require("./generator");
const SortContext = require("./SortContext");
const { setupTracing } = require("./tracing");

// Importa todas as estratégias de ordenação
const BubbleSort = require("./strategies/BubbleSort");
const ImprovedBubbleSort = require("./strategies/ImprovedBubbleSort");
const InsertionSort = require("./strategies/InsertionSort");
const SelectionSort = require("./strategies/SelectionSort");
const QuickSort = require("./strategies/QuickSort");
const MergeSort = require("./strategies/MergeSort");
const HeapSort = require("./strategies/HeapSort");
const TimSort = require("./strategies/TimSort");
const ShellSort = require("./strategies/ShellSort");
const CountingSort = require("./strategies/CountingSort");
const RadixSort = require("./strategies/RadixSort");

// Importa as estratégias paralelas
const ParallelQuickSort = require("./strategies/ParallelQuickSort");
const ParallelMergeSort = require("./strategies/ParallelMergeSort");
const ParallelQuickSortPooled = require("./strategies/ParallelQuickSortPooled");
const ParallelMergeSortPooled = require("./strategies/ParallelMergeSortPooled");
const MultiprocessingSort = require("./strategies/MultiprocessingSort");

// Configura o tracer para Jaeger
const tracer = setupTracing("algoritmos-ordenacao");

// Lista de algoritmos disponíveis
const algorithms = [
  new BubbleSort(),
  new ImprovedBubbleSort(),
  new InsertionSort(),
  new SelectionSort(),
  new QuickSort(),
  new MergeSort(),
  new HeapSort(),
  new TimSort(),
  new ShellSort(),
  new CountingSort(),
  new RadixSort(),
  // Adiciona versões paralelas
  new ParallelQuickSort(),
  new ParallelMergeSort(),
  // Adiciona versões paralelas com pooling
  new ParallelQuickSortPooled(),
  new ParallelMergeSortPooled(),
  // Adiciona versão usando multiprocessamento
  new MultiprocessingSort(),
];

/**
 * Lê os dados do arquivo para um array
 * @param {string} filename - Nome do arquivo de dados
 * @returns {Array} - Array com os dados lidos
 */
function readDataFromFile(filename) {
  const data = fs.readFileSync(filename, "utf8");
  return data
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map(Number);
}

/**
 * Executa um algoritmo de ordenação várias vezes e retorna estatísticas
 * @param {Object} strategy - Estratégia de ordenação
 * @param {Array} data - Dados a serem ordenados
 * @param {number} repeatCount - Número de repetições
 * @returns {Object} - Estatísticas combinadas
 */
async function runAlgorithm(strategy, data, repeatCount = 5) {
  const context = new SortContext(strategy, tracer);
  let totalTime = 0;
  let totalComparisons = 0;
  let totalSwaps = 0;
  let results;

  // Cria um span principal para todas as execuções deste algoritmo
  const algorithmSpan = tracer.startSpan(`benchmark_${strategy.getName()}`, {
    attributes: {
      "algorithm.name": strategy.getName(),
      "array.length": data.length,
      repeat_count: repeatCount,
      "operation.type": "benchmark",
      parallel: strategy.constructor.name.startsWith("Parallel"),
    },
  });

  try {
    for (let i = 0; i < repeatCount; i++) {
      // Cria um span filho para esta repetição específica
      const iterationSpan = tracer.startSpan(`iteration_${i + 1}`, {
        attributes: {
          "algorithm.name": strategy.getName(),
          "array.length": data.length,
          iteration: i + 1,
          "operation.type": "sorting_iteration",
        },
      });

      try {
        // Executa o algoritmo
        results = await context.executeStrategy(data);

        // Acumula estatísticas
        totalTime += results.stats.executionTime;
        totalComparisons += results.stats.comparisons;
        totalSwaps += results.stats.swaps;

        // Adiciona métricas para esta iteração
        iterationSpan.setAttributes({
          "execution.time_ms": results.stats.executionTime,
          "operation.comparisons": results.stats.comparisons,
          "operation.swaps": results.stats.swaps,
          success: true,
        });
        iterationSpan.end();
      } catch (error) {
        // Em caso de erro, registra no span e finaliza
        iterationSpan.setStatus({
          code: 2, // Error
          message: error.message,
        });
        iterationSpan.recordException(error);
        iterationSpan.setAttributes({
          success: false,
        });
        iterationSpan.end();
        throw error;
      }
    }

    // Calcula médias e adiciona ao span principal
    const avgTime = totalTime / repeatCount;
    const avgComparisons = totalComparisons / repeatCount;
    const avgSwaps = totalSwaps / repeatCount;

    algorithmSpan.setAttributes({
      "avg_execution.time_ms": avgTime,
      "avg_operation.comparisons": avgComparisons,
      "avg_operation.swaps": avgSwaps,
      total_iterations: repeatCount,
      success: true,
    });
    algorithmSpan.end();

    // Retorna resultados formatados
    return {
      algorithmName: strategy.getName(),
      stats: {
        executionTime: avgTime,
        comparisons: avgComparisons,
        swaps: avgSwaps,
        arrayLength: data.length,
      },
      isSorted: validateSorting(results.sortedArray),
    };
  } catch (error) {
    // Em caso de erro no processo como um todo
    algorithmSpan.setStatus({
      code: 2, // Error
      message: error.message,
    });
    algorithmSpan.recordException(error);
    algorithmSpan.setAttributes({
      success: false,
    });
    algorithmSpan.end();
    throw error;
  }
}

/**
 * Valida se o array está corretamente ordenado
 * @param {Array} array - Array a ser validado
 * @returns {boolean} - true se ordenado, false caso contrário
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
 * Executa todos os algoritmos de ordenação com um conjunto de dados
 * @param {string} dataFile - Arquivo com os dados
 * @param {number} repeatCount - Número de repetições para cada algoritmo
 */
async function runAllAlgorithms(dataFile, repeatCount = 5) {
  // Cria um span para o processamento deste conjunto de dados
  const datasetSpan = tracer.startSpan("process_dataset", {
    attributes: {
      data_file: dataFile,
      repeat_count: repeatCount,
      "operation.type": "dataset_processing",
    },
  });

  try {
    console.log(`\nCarregando dados de ${dataFile}...`);
    const data = readDataFromFile(dataFile);
    console.log(`Total de ${data.length} números carregados.`);

    datasetSpan.addEvent("data_loaded", {
      array_length: data.length,
      source_file: dataFile,
    });

    const results = [];
    console.log("\nExecutando algoritmos de ordenação:");

    for (const algorithm of algorithms) {
      try {
        console.log(`- ${algorithm.getName()}`);
        const result = await runAlgorithm(algorithm, data, repeatCount);
        results.push(result);

        datasetSpan.addEvent("algorithm_completed", {
          algorithm_name: algorithm.getName(),
          execution_time_ms: result.stats.executionTime,
          comparisons: result.stats.comparisons,
          swaps: result.stats.swaps,
          is_sorted: result.isSorted,
        });

        // Exibe resultados parciais
        console.log(
          `  Tempo: ${result.stats.executionTime.toFixed(2)}ms | ` +
            `Comparações: ${result.stats.comparisons.toFixed(0)} | ` +
            `Trocas: ${result.stats.swaps.toFixed(0)} | ` +
            `Ordenado: ${result.isSorted ? "Sim" : "Não"}`
        );
      } catch (error) {
        console.error(
          `  Erro ao executar ${algorithm.getName()}: ${error.message}`
        );

        datasetSpan.addEvent("algorithm_error", {
          algorithm_name: algorithm.getName(),
          error_message: error.message,
        });
      }
    }

    // Adiciona evento para todas as execuções concluídas
    datasetSpan.addEvent("all_algorithms_completed", {
      algorithm_count: algorithms.length,
      successful_count: results.length,
    });

    datasetSpan.setAttributes({
      success: true,
      algorithm_count: algorithms.length,
      completed_count: results.length,
    });
    datasetSpan.end();

    return results;
  } catch (error) {
    datasetSpan.setStatus({
      code: 2, // Error
      message: error.message,
    });
    datasetSpan.recordException(error);
    datasetSpan.setAttributes({
      success: false,
    });
    datasetSpan.end();
    throw error;
  }
}

/**
 * Salva os resultados em um arquivo JSON
 * @param {Array} results - Resultados a serem salvos
 * @param {string} filename - Nome do arquivo
 */
function saveResultsToFile(results, filename) {
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\nResultados salvos em ${filename}`);
}

/**
 * Função principal
 */
async function main() {
  // Cria um span para todo o processo
  const mainSpan = tracer.startSpan("main", {
    attributes: {
      "operation.type": "main_process",
    },
  });

  try {
    // Define os tamanhos de arrays a serem testados
    const dataSizes = [1000, 10000, 100000];

    // Define o número de repetições para cada algoritmo
    const repeatCount = 3;

    // Processa cada tamanho de array
    for (const size of dataSizes) {
      const dataFile = `src/dados_${size}.txt`;

      // Verifica se o arquivo de dados existe, caso contrário, gera os dados
      if (!fs.existsSync(dataFile)) {
        console.log(`\nGerando dados aleatórios para ${size} números...`);
        generateRandomData(size, dataFile);
        console.log(`Dados gerados e salvos em ${dataFile}`);
      }

      mainSpan.addEvent("processing_dataset", {
        array_size: size,
        data_file: dataFile,
        repeat_count: repeatCount,
      });

      const results = await runAllAlgorithms(dataFile, repeatCount);

      // Ordenando os resultados por tempo de execução
      results.sort((a, b) => a.stats.executionTime - b.stats.executionTime);

      // Imprime tabela comparativa
      console.log("\n===== COMPARAÇÃO DE ALGORITMOS =====");
      console.log(
        "Algoritmo".padEnd(25) +
          "Tempo (ms)".padEnd(15) +
          "Comparações".padEnd(15) +
          "Trocas".padEnd(15)
      );
      console.log("-".repeat(70));

      for (const result of results) {
        console.log(
          result.algorithmName.padEnd(25) +
            result.stats.executionTime.toFixed(2).padEnd(15) +
            result.stats.comparisons.toFixed(0).padEnd(15) +
            result.stats.swaps.toFixed(0).padEnd(15)
        );
      }

      // Salva os resultados em arquivo
      const resultFilename = `resultados_${size}.json`;
      saveResultsToFile(results, resultFilename);

      console.log(`\nResultados salvos em ${resultFilename}`);

      mainSpan.addEvent("dataset_processed", {
        array_size: size,
        result_file: resultFilename,
      });
    }

    mainSpan.setAttributes({
      success: true,
    });
    mainSpan.end();
  } catch (error) {
    console.error("Erro:", error);

    mainSpan.setStatus({
      code: 2, // Error
      message: error.message,
    });
    mainSpan.recordException(error);
    mainSpan.setAttributes({
      success: false,
    });
    mainSpan.end();
  }
}

// Inicia a execução
main().catch(console.error);
