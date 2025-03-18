const SortStrategy = require("./SortStrategy");

class ImprovedBubbleSort extends SortStrategy {
  getName() {
    return "Bubble Sort Melhorado";
  }

  sort(array) {
    this.resetStats();
    const n = array.length;
    const result = [...array]; // Cria uma cópia do array
    let swapped;

    for (let i = 0; i < n; i++) {
      swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        this.comparisons++;
        if (result[j] > result[j + 1]) {
          // Troca os elementos
          [result[j], result[j + 1]] = [result[j + 1], result[j]];
          this.swaps++;
          swapped = true;
        }
      }
      // Se nenhuma troca foi feita nesta passagem, o array já está ordenado
      if (!swapped) break;
    }

    return result;
  }
}

module.exports = ImprovedBubbleSort;
