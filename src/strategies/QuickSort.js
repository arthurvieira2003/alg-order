const SortStrategy = require("./SortStrategy");

class QuickSort extends SortStrategy {
  getName() {
    return "Quick Sort";
  }

  sort(array) {
    this.resetStats();
    const result = [...array]; // Cria uma cópia do array
    this.quickSort(result, 0, result.length - 1);
    return result;
  }

  quickSort(arr, low, high) {
    if (low < high) {
      // Encontra o pivô e particiona o array
      const pivotIndex = this.partition(arr, low, high);

      // Ordenação recursiva dos subarrays
      this.quickSort(arr, low, pivotIndex - 1);
      this.quickSort(arr, pivotIndex + 1, high);
    }
  }

  partition(arr, low, high) {
    // Escolhe o elemento mais à direita como pivô
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      this.comparisons++;
      if (arr[j] <= pivot) {
        i++;
        // Troca arr[i] e arr[j]
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          this.swaps++;
        }
      }
    }

    // Coloca o pivô na posição correta
    if (i + 1 !== high) {
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      this.swaps++;
    }

    return i + 1;
  }
}

module.exports = QuickSort;
