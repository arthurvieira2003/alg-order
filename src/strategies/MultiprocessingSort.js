const ParallelSortStrategy = require("./ParallelSortStrategy");
const MergeSort = require("./MergeSort");
const { fork } = require("child_process");
const path = require("path");
const os = require("os");

/**
 * Estratégia de ordenação que utiliza multiprocessamento para dividir o trabalho
 */
class MultiprocessingSort extends ParallelSortStrategy {
  constructor() {
    super();
    this.threshold = 100000; // Threshold para usar multiprocessamento
    this.numProcesses = Math.max(2, os.cpus().length - 1);
    this.baseAlgorithm = "mergesort"; // Algoritmo base usado para ordenação

    // Caminho para o script do child process
    this.scriptPath = path.join(__dirname, "processes", "sortProcess.js");
  }

  getName() {
    return "Multiprocessing Sort";
  }

  sort(array) {
    this.resetStats();

    // Para arrays pequenos, usamos a implementação sequencial
    if (array.length < this.threshold) {
      const mergeSort = new MergeSort();
      const result = mergeSort.sort(array);
      this.comparisons = mergeSort.comparisons;
      this.swaps = mergeSort.swaps;
      return result;
    }

    return this.multiprocessSort(array);
  }

  async multiprocessSort(array) {
    try {
      // Divide o array em chunks para cada processo
      const chunks = this.splitArray(array, this.numProcesses);

      // Cria um child process para cada chunk
      const processPromises = chunks.map((chunk) =>
        this.createSortProcess(chunk, this.baseAlgorithm)
      );

      // Aguarda todos os processos terminarem
      const results = await Promise.all(processPromises);

      // Extrai os arrays ordenados e as estatísticas
      const sortedChunks = results.map((result) => result.sortedArray);
      const processStats = results.map((result) => result.stats);

      // Mescla os chunks ordenados em um único array
      const mergedArray = this.mergeArrays(sortedChunks);

      // Atualiza as estatísticas
      this.mergeWorkerStats(processStats);

      return mergedArray;
    } catch (error) {
      console.error("Erro na ordenação multiprocesso:", error);

      // Fallback para ordenação sequencial
      const mergeSort = new MergeSort();
      const fallbackResult = mergeSort.sort(array);
      this.comparisons = mergeSort.comparisons;
      this.swaps = mergeSort.swaps;

      return fallbackResult;
    }
  }

  /**
   * Cria um processo filho para ordenar um chunk de dados
   * @param {Array} chunk - Chunk de dados a ser ordenado
   * @param {string} algorithm - Algoritmo a ser usado
   * @returns {Promise} - Promise que resolve com o resultado da ordenação
   */
  createSortProcess(chunk, algorithm) {
    return new Promise((resolve, reject) => {
      // Cria o processo filho
      const child = fork(this.scriptPath);

      // Define um timeout para o processo
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error("Timeout na ordenação do processo"));
      }, 30000); // 30 segundos

      // Envia os dados para o processo filho
      child.send({ array: chunk, algorithm });

      // Define o handler para receber o resultado
      child.on("message", (result) => {
        clearTimeout(timeout);
        resolve(result);
        child.kill();
      });

      // Define o handler para erros
      child.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
        child.kill();
      });

      // Define o handler para quando o processo terminar
      child.on("exit", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Processo filho terminou com código ${code}`));
        }
      });
    });
  }

  /**
   * Mescla múltiplos arrays ordenados em um único array
   * @param {Array} arrays - Arrays ordenados
   * @returns {Array} - Array resultante ordenado
   */
  mergeArrays(arrays) {
    // Se só tiver um array, retorna ele mesmo
    if (arrays.length === 1) {
      return arrays[0];
    }

    // Implementação eficiente da mesclagem de múltiplos arrays
    let result = arrays[0];

    for (let i = 1; i < arrays.length; i++) {
      result = this.merge(result, arrays[i]);
    }

    return result;
  }

  /**
   * Mescla dois arrays ordenados
   * @param {Array} left - Primeiro array
   * @param {Array} right - Segundo array
   * @returns {Array} - Array mesclado ordenado
   */
  merge(left, right) {
    const result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
      this.comparisons++;
      if (left[leftIndex] <= right[rightIndex]) {
        result.push(left[leftIndex]);
        leftIndex++;
      } else {
        result.push(right[rightIndex]);
        rightIndex++;
      }
      this.swaps++;
    }

    while (leftIndex < left.length) {
      result.push(left[leftIndex]);
      leftIndex++;
      this.swaps++;
    }

    while (rightIndex < right.length) {
      result.push(right[rightIndex]);
      rightIndex++;
      this.swaps++;
    }

    return result;
  }
}

module.exports = MultiprocessingSort;
