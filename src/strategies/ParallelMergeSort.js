const ParallelSortStrategy = require("./ParallelSortStrategy");
const MergeSort = require("./MergeSort");
const path = require("path");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const os = require("os");

// Script para o worker do MergeSort
const WORKER_SCRIPT = path.join(__dirname, "workers", "mergeSortWorker.js");

class ParallelMergeSort extends ParallelSortStrategy {
  constructor() {
    super();
    this.threshold = 50000; // Threshold para usar paralelismo
    this.chunkSize = Math.max(
      10000,
      Math.floor(this.threshold / this.numWorkers)
    );
  }

  getName() {
    return "Parallel Merge Sort";
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

    return this.parallelMergeSort(array);
  }

  async parallelMergeSort(array) {
    try {
      // Calcula o número ideal de chunks baseado no tamanho do array
      // Para arrays muito grandes, mais chunks, mas não mais que núcleos disponíveis
      const optimalChunks = Math.min(
        this.numWorkers,
        Math.ceil(array.length / this.chunkSize)
      );

      // Determinar número de chunks baseado no tamanho do array
      const chunks = this.splitArray(array, optimalChunks);

      // Criar um worker para cada chunk
      const workerPromises = chunks.map((chunk) =>
        this.createWorker(WORKER_SCRIPT, { array: chunk })
      );

      // Esperar que todos os workers terminem
      const results = await Promise.all(workerPromises);

      // Extrair os arrays ordenados e as estatísticas
      const sortedChunks = results.map((result) => result.sortedArray);
      const workerStats = results.map((result) => result.stats);

      // Mesclar os resultados no thread principal usando uma abordagem de merging eficiente
      const mergedArray = this.efficientMerge(sortedChunks);

      // Atualizar estatísticas
      this.mergeWorkerStats(workerStats);

      return mergedArray;
    } catch (error) {
      console.error("Erro na ordenação paralela:", error);

      // Fallback para versão sequencial
      const mergeSort = new MergeSort();
      const fallbackResult = mergeSort.sort(array);
      this.comparisons = mergeSort.comparisons;
      this.swaps = mergeSort.swaps;

      return fallbackResult;
    }
  }

  /**
   * Implementa uma mesclagem eficiente de múltiplos arrays ordenados usando uma abordagem de divisão e conquista
   * @param {Array} arrays - Arrays ordenados a serem mesclados
   * @returns {Array} - Um único array ordenado
   */
  efficientMerge(arrays) {
    // Se só tiver um array, retorna ele mesmo
    if (arrays.length === 1) {
      return arrays[0];
    }

    // Se tiver dois arrays, usa o merge simples
    if (arrays.length === 2) {
      return this.merge(arrays[0], arrays[1]);
    }

    // Divide os arrays em dois grupos
    const mid = Math.floor(arrays.length / 2);
    const leftArrays = arrays.slice(0, mid);
    const rightArrays = arrays.slice(mid);

    // Mescla recursivamente cada grupo
    const leftMerged = this.efficientMerge(leftArrays);
    const rightMerged = this.efficientMerge(rightArrays);

    // Mescla os dois grupos resultantes
    return this.merge(leftMerged, rightMerged);
  }

  merge(left, right) {
    const result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    // Comparar elementos e adicionar o menor ao resultado
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

    // Adicionar elementos restantes
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

module.exports = ParallelMergeSort;
