const SortStrategy = require("./SortStrategy");

class HeapSort extends SortStrategy {
  getName() {
    return "Heap Sort";
  }

  sort(array) {
    this.resetStats();
    const result = [...array]; // Cria uma cópia do array
    const n = result.length;

    // Constrói um max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      this.heapify(result, n, i);
    }

    // Extrai elementos do heap um por um
    for (let i = n - 1; i > 0; i--) {
      // Move a raiz atual para o final
      [result[0], result[i]] = [result[i], result[0]];
      this.swaps++;

      // Chama max heapify no heap reduzido
      this.heapify(result, i, 0);
    }

    return result;
  }

  // Para ajustar um subárvore com raiz no node i
  heapify(arr, n, i) {
    let largest = i; // Inicializa o maior como raiz
    const left = 2 * i + 1; // Esquerda = 2*i + 1
    const right = 2 * i + 2; // Direita = 2*i + 2

    // Se o filho da esquerda é maior que a raiz
    if (left < n) {
      this.comparisons++;
      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }

    // Se o filho da direita é maior que o maior até agora
    if (right < n) {
      this.comparisons++;
      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }

    // Se o maior não é a raiz
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      this.swaps++;

      // Heapify recursivamente a subárvore afetada
      this.heapify(arr, n, largest);
    }
  }
}

module.exports = HeapSort;
