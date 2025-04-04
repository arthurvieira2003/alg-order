const ParallelSortStrategy = require("./ParallelSortStrategy");
const QuickSort = require("./QuickSort");
const path = require("path");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const os = require("os");
const WorkerPool = require("../WorkerPool");

// Script para o worker do QuickSort
const WORKER_SCRIPT = path.join(__dirname, "workers", "quickSortWorker.js");

/**
 * Implementação do QuickSort utilizando um pool de workers
 */
class ParallelQuickSortPooled extends ParallelSortStrategy {
  constructor() {
    super();
    this.threshold = 50000; // Limiar para paralelização
    this.maxWorkers = this.numWorkers;
    this.minPartitionSize = 10000; // Tamanho mínimo para paralelizar uma partição

    // Cria o worker pool
    this.workerPool = null;
  }

  getName() {
    return "Parallel Quick Sort (Pooled)";
  }

  sort(array) {
    this.resetStats();

    // Para arrays pequenos, usamos a implementação sequencial
    if (array.length < this.threshold) {
      const quickSort = new QuickSort();
      const result = quickSort.sort(array);
      this.comparisons = quickSort.comparisons;
      this.swaps = quickSort.swaps;
      return result;
    }

    // Inicializa o worker pool se ainda não estiver inicializado
    if (!this.workerPool) {
      this.workerPool = new WorkerPool(WORKER_SCRIPT, this.maxWorkers);
    }

    return this.parallelQuickSort(array);
  }

  async parallelQuickSort(array) {
    try {
      // Divide o array em partições balanceadas
      const partitions = this.createBalancedPartitions(array);

      // Submete cada partição para processamento no pool
      const sortPromises = partitions.map((partition) =>
        this.workerPool.runTask({ array: partition })
      );

      // Aguarda o processamento de todas as partições
      const results = await Promise.all(sortPromises);

      // Extrai os arrays ordenados e as estatísticas
      const sortedPartitions = results.map((result) => result.sortedArray);
      const workerStats = results.map((result) => result.stats);

      // Combina os resultados ordenados
      const sortedArray = this.combineSortedPartitions(sortedPartitions);

      // Atualiza as estatísticas
      this.mergeWorkerStats(workerStats);

      return sortedArray;
    } catch (error) {
      console.error("Erro na ordenação paralela:", error);

      // Fallback para versão sequencial
      const quickSort = new QuickSort();
      const fallbackResult = quickSort.sort(array);
      this.comparisons = quickSort.comparisons;
      this.swaps = quickSort.swaps;

      return fallbackResult;
    }
  }

  /**
   * Cria partições balanceadas para processamento paralelo
   * @param {Array} array - Array a ser dividido
   * @returns {Array} - Array de partições
   */
  createBalancedPartitions(array) {
    // Determina o número de partições baseado no tamanho do array
    const numPartitions = Math.min(
      this.maxWorkers * 2, // Usamos 2x o número de workers para melhor balanceamento
      Math.ceil(array.length / this.minPartitionSize)
    );

    if (numPartitions <= 1) {
      return [array];
    }

    // Determina o tamanho de cada partição
    const partitionSize = Math.ceil(array.length / numPartitions);

    // Cria as partições
    const partitions = [];
    for (let i = 0; i < array.length; i += partitionSize) {
      partitions.push(array.slice(i, i + partitionSize));
    }

    return partitions;
  }

  /**
   * Combina partições ordenadas em um único array ordenado
   * @param {Array} sortedPartitions - Array de partições ordenadas
   * @returns {Array} - Array ordenado resultante
   */
  combineSortedPartitions(sortedPartitions) {
    // Se só tiver uma partição, retorna ela mesma
    if (sortedPartitions.length === 1) {
      return sortedPartitions[0];
    }

    // Concatena as partições
    const result = [].concat(...sortedPartitions);

    // Ordena o resultado final
    // Este é um passo necessário porque as partições individuais estão ordenadas,
    // mas entre elas não há ordenação garantida
    return this.mergeSortFinal(result);
  }

  /**
   * Implementação do MergeSort para combinar as partições finais
   * @param {Array} array - Array a ser ordenado
   * @returns {Array} - Array ordenado
   */
  mergeSortFinal(array) {
    if (array.length <= 1) {
      return array;
    }

    const mid = Math.floor(array.length / 2);
    const left = this.mergeSortFinal(array.slice(0, mid));
    const right = this.mergeSortFinal(array.slice(mid));

    return this.merge(left, right);
  }

  /**
   * Função para mesclar dois arrays ordenados
   * @param {Array} left - Primeiro array
   * @param {Array} right - Segundo array
   * @returns {Array} - Array mesclado
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
      this.swaps++; // Cada inserção é considerada uma movimentação
    }

    // Adiciona os elementos restantes
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

module.exports = ParallelQuickSortPooled;
