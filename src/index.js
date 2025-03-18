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
function runAlgorithm(strategy, data, repeatCount = 5) {
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
        results = context.executeStrategy(data);

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
function runAllAlgorithms(dataFile, repeatCount = 5) {
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
      const algorithmName = algorithm.getName();
      console.log(`\n- Executando ${algorithmName}...`);

      try {
        const result = runAlgorithm(algorithm, data, repeatCount);
        results.push(result);

        console.log(
          `  Tempo médio: ${result.stats.executionTime.toFixed(2)} ms`
        );
        console.log(
          `  Comparações médias: ${result.stats.comparisons.toFixed(0)}`
        );
        console.log(`  Trocas médias: ${result.stats.swaps.toFixed(0)}`);
        console.log(`  Ordenação válida: ${result.isSorted ? "Sim" : "Não"}`);

        datasetSpan.addEvent("algorithm_completed", {
          algorithm: algorithmName,
          execution_time_ms: result.stats.executionTime,
          comparisons: result.stats.comparisons,
          swaps: result.stats.swaps,
          is_sorted: result.isSorted,
        });
      } catch (error) {
        console.error(`  Erro ao executar ${algorithmName}:`, error.message);

        datasetSpan.addEvent("algorithm_error", {
          algorithm: algorithmName,
          error: error.message,
        });
      }
    }

    // Ordenando os resultados por tempo de execução
    results.sort((a, b) => a.stats.executionTime - b.stats.executionTime);

    // Imprime tabela comparativa
    console.log("\n===== COMPARAÇÃO DE ALGORITMOS =====");
    console.log(
      "Algoritmo".padEnd(20) +
        "Tempo (ms)".padEnd(15) +
        "Comparações".padEnd(15) +
        "Trocas".padEnd(15)
    );
    console.log("-".repeat(65));

    for (const result of results) {
      console.log(
        result.algorithmName.padEnd(20) +
          result.stats.executionTime.toFixed(2).padEnd(15) +
          result.stats.comparisons.toFixed(0).padEnd(15) +
          result.stats.swaps.toFixed(0).padEnd(15)
      );
    }

    // Salva os resultados em arquivo
    const resultFilename = `resultados_${data.length}.json`;
    saveResultsToFile(results, resultFilename);

    datasetSpan.addEvent("results_saved", {
      result_file: resultFilename,
      algorithm_count: results.length,
    });

    datasetSpan.setAttributes({
      success: true,
      array_length: data.length,
      fastest_algorithm: results[0]?.algorithmName || "none",
      slowest_algorithm: results[results.length - 1]?.algorithmName || "none",
    });
    datasetSpan.end();
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
 * Função principal que gera os dados e executa os algoritmos
 */
function main() {
  // Cria um span para toda a execução do programa
  const mainSpan = tracer.startSpan("main_execution", {
    attributes: {
      "operation.type": "main_program",
    },
  });

  try {
    const sizes = [1000, 10000, 100000];
    const repeatCount = 5;

    mainSpan.setAttribute("dataset_sizes", JSON.stringify(sizes));
    mainSpan.setAttribute("repeat_count", repeatCount);

    for (const size of sizes) {
      mainSpan.addEvent("generating_dataset", {
        size: size,
      });

      const dataFile = generateRandomData(size, 0, 10000, `dados_${size}.txt`);

      mainSpan.addEvent("dataset_generated", {
        size: size,
        file: dataFile,
      });

      runAllAlgorithms(dataFile, repeatCount);

      mainSpan.addEvent("dataset_processed", {
        size: size,
      });
    }

    mainSpan.setAttributes({
      success: true,
      completed_datasets: sizes.length,
    });
    mainSpan.end();
  } catch (error) {
    mainSpan.setStatus({
      code: 2, // Error
      message: error.message,
    });
    mainSpan.recordException(error);
    mainSpan.setAttributes({
      success: false,
    });
    mainSpan.end();

    console.error("Erro na execução principal:", error);
  }
}

// Executa a função principal
if (require.main === module) {
  main();
}
