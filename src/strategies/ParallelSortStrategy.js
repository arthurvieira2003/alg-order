const SortStrategy = require("./SortStrategy");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const os = require("os");

/**
 * Classe base para estratégias de ordenação paralelizadas
 */
class ParallelSortStrategy extends SortStrategy {
  constructor() {
    super();
    this.numWorkers = Math.max(2, os.cpus().length - 1); // Usa um número de workers baseado no número de CPUs
  }

  /**
   * Nome do algoritmo de ordenação paralelizado
   * @returns {string}
   */
  getName() {
    throw new Error("O método getName() deve ser implementado");
  }

  /**
   * Método para ordenar um array utilizando paralelismo
   * @param {Array} array - Array a ser ordenado
   * @returns {Array} - Array ordenado
   */
  sort(array) {
    throw new Error("O método sort() deve ser implementado");
  }

  /**
   * Cria um worker com os dados especificados
   * @param {string} scriptPath - Caminho para o script do worker
   * @param {object} data - Dados a serem enviados para o worker
   * @returns {Promise} - Promise que resolve quando o worker termina
   */
  createWorker(scriptPath, data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(scriptPath, { workerData: data });

      worker.on("message", resolve);
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Worker parou com código de saída ${code}`));
        }
      });
    });
  }

  /**
   * Divide o array em chunks para processamento paralelo
   * @param {Array} array - Array a ser dividido
   * @param {number} numChunks - Número de chunks
   * @returns {Array} - Array de chunks
   */
  splitArray(array, numChunks) {
    const result = [];
    const chunkSize = Math.ceil(array.length / numChunks);

    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }

    return result;
  }

  /**
   * Adiciona estatísticas de workers ao contador principal
   * @param {Array} workerStats - Array de estatísticas dos workers
   */
  mergeWorkerStats(workerStats) {
    for (const stats of workerStats) {
      this.comparisons += stats.comparisons || 0;
      this.swaps += stats.swaps || 0;
    }
  }
}

module.exports = ParallelSortStrategy;
