const SortStrategy = require("./SortStrategy");

class CountingSort extends SortStrategy {
  getName() {
    return "Counting Sort";
  }

  sort(array) {
    this.resetStats();
    const n = array.length;

    // Encontra o valor máximo e mínimo no array
    let max = array[0];
    let min = array[0];

    for (let i = 1; i < n; i++) {
      this.comparisons++;
      if (array[i] > max) {
        max = array[i];
      }

      this.comparisons++;
      if (array[i] < min) {
        min = array[i];
      }
    }

    // Cria array de contagem com tamanho baseado no intervalo de valores
    const range = max - min + 1;
    const count = new Array(range).fill(0);
    const output = new Array(n);

    // Armazena a contagem de cada elemento
    for (let i = 0; i < n; i++) {
      count[array[i] - min]++;
    }

    // Altera count[i] para que contenha a posição real
    // deste elemento no array de saída
    for (let i = 1; i < range; i++) {
      count[i] += count[i - 1];
    }

    // Constrói o array de saída
    for (let i = n - 1; i >= 0; i--) {
      output[count[array[i] - min] - 1] = array[i];
      count[array[i] - min]--;
      this.swaps++;
    }

    return output;
  }
}

module.exports = CountingSort;
