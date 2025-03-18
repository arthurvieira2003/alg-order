const SortStrategy = require("./SortStrategy");

class InsertionSort extends SortStrategy {
  getName() {
    return "Insertion Sort";
  }

  sort(array) {
    this.resetStats();
    const n = array.length;
    const result = [...array]; // Cria uma cópia do array

    for (let i = 1; i < n; i++) {
      const key = result[i];
      let j = i - 1;

      // Move os elementos que são maiores que a chave
      // para uma posição à frente de sua posição atual
      while (j >= 0) {
        this.comparisons++;
        if (result[j] > key) {
          result[j + 1] = result[j];
          this.swaps++;
          j--;
        } else {
          break;
        }
      }

      result[j + 1] = key;
      if (j + 1 !== i) this.swaps++; // Contabiliza a inserção como uma troca
    }

    return result;
  }
}

module.exports = InsertionSort;
