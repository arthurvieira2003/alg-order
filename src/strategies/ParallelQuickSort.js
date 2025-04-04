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

// Script para o worker do QuickSort
const WORKER_SCRIPT = path.join(__dirname, "workers", "quickSortWorker.js");

class ParallelQuickSort extends ParallelSortStrategy {
  constructor() {
    super();
    // Aumenta o limiar para arrays maiores
    this.threshold = 50000; // Threshold para usar paralelismo
    this.maxDepth = 2; // Limita a profundidade de divisão paralela
  }

  getName() {
    return "Parallel Quick Sort";
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

    return this.parallelQuickSort(array, 0);
  }

  async parallelQuickSort(array, depth) {
    const result = [...array]; // Cria uma cópia do array

    try {
      // Se a profundidade for muito grande, usa ordenação sequencial
      if (depth >= this.maxDepth || result.length < this.threshold) {
        this.quickSort(result, 0, result.length - 1);
        return result;
      }

      // Realiza a primeira partição no thread principal
      const pivotIndex = this.partition(result, 0, result.length - 1);

      // Divide em duas partes para processamento paralelo
      const leftArray = result.slice(0, pivotIndex);
      const rightArray = result.slice(pivotIndex + 1);

      // Se alguma das partes for muito pequena, processa sequencialmente
      if (
        leftArray.length < this.threshold / 4 ||
        rightArray.length < this.threshold / 4
      ) {
        this.quickSort(result, 0, pivotIndex - 1);
        this.quickSort(result, pivotIndex + 1, result.length - 1);
        return result;
      }

      // Processa recursivamente em paralelo
      const [leftResult, rightResult] = await Promise.all([
        this.createWorker(WORKER_SCRIPT, { array: leftArray }),
        this.createWorker(WORKER_SCRIPT, { array: rightArray }),
      ]);

      // Combina os resultados
      for (let i = 0; i < leftResult.sortedArray.length; i++) {
        result[i] = leftResult.sortedArray[i];
      }

      result[pivotIndex] = result[pivotIndex]; // Mantém o pivô

      for (let i = 0; i < rightResult.sortedArray.length; i++) {
        result[pivotIndex + 1 + i] = rightResult.sortedArray[i];
      }

      // Atualiza as estatísticas
      this.mergeWorkerStats([leftResult.stats, rightResult.stats]);

      return result;
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

  // Implementação do QuickSort para uso local
  quickSort(arr, low, high) {
    if (low < high) {
      const pivotIndex = this.partition(arr, low, high);
      this.quickSort(arr, low, pivotIndex - 1);
      this.quickSort(arr, pivotIndex + 1, high);
    }
  }

  partition(arr, low, high) {
    // Usa uma estratégia melhor para escolher o pivô (mediana de 3)
    const mid = Math.floor((low + high) / 2);

    // Ordena low, mid, high para que o pivô seja o elemento do meio
    if (arr[mid] < arr[low]) this.swap(arr, low, mid);
    if (arr[high] < arr[low]) this.swap(arr, low, high);
    if (arr[mid] < arr[high]) this.swap(arr, mid, high);

    // Agora arr[high] é a mediana dos 3 elementos
    const pivot = arr[high];

    let i = low - 1;

    for (let j = low; j < high; j++) {
      this.comparisons++;
      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          this.swap(arr, i, j);
        }
      }
    }

    if (i + 1 !== high) {
      this.swap(arr, i + 1, high);
    }

    return i + 1;
  }

  swap(arr, i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.swaps++;
  }
}

module.exports = ParallelQuickSort;
