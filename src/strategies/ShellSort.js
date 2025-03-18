const SortStrategy = require("./SortStrategy");

class ShellSort extends SortStrategy {
  getName() {
    return "Shell Sort";
  }

  sort(array) {
    this.resetStats();
    const n = array.length;
    const result = [...array]; // Cria uma cópia do array

    // Inicia com um intervalo grande, depois reduz para 1
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      // Realiza insertion sort em gaps
      for (let i = gap; i < n; i++) {
        // Salva result[i] em temp e faz um buraco na posição i
        const temp = result[i];

        // Desloca elementos anteriores até encontrar a posição correta para result[i]
        let j;
        for (j = i; j >= gap; j -= gap) {
          this.comparisons++;
          if (result[j - gap] > temp) {
            result[j] = result[j - gap];
            this.swaps++;
          } else {
            break;
          }
        }

        // Coloca temp (valor original de result[i]) na posição correta
        if (j !== i) {
          result[j] = temp;
          this.swaps++;
        }
      }
    }

    return result;
  }
}

module.exports = ShellSort;
