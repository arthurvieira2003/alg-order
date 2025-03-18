const SortStrategy = require("./SortStrategy");

class SelectionSort extends SortStrategy {
  getName() {
    return "Selection Sort";
  }

  sort(array) {
    this.resetStats();
    const n = array.length;
    const result = [...array]; // Cria uma cópia do array

    for (let i = 0; i < n - 1; i++) {
      let minIndex = i;

      // Encontra o índice do menor elemento no array não ordenado
      for (let j = i + 1; j < n; j++) {
        this.comparisons++;
        if (result[j] < result[minIndex]) {
          minIndex = j;
        }
      }

      // Troca o elemento mínimo com o primeiro elemento não ordenado
      if (minIndex !== i) {
        [result[i], result[minIndex]] = [result[minIndex], result[i]];
        this.swaps++;
      }
    }

    return result;
  }
}

module.exports = SelectionSort;
