const SortStrategy = require("./SortStrategy");

class MergeSort extends SortStrategy {
  getName() {
    return "Merge Sort";
  }

  sort(array) {
    this.resetStats();
    const result = [...array]; // Cria uma cópia do array
    return this.mergeSort(result);
  }

  mergeSort(arr) {
    const n = arr.length;

    // Caso base: um array de tamanho 0 ou 1 já está ordenado
    if (n <= 1) {
      return arr;
    }

    // Divide o array ao meio
    const mid = Math.floor(n / 2);
    const left = arr.slice(0, mid);
    const right = arr.slice(mid);

    // Ordena recursivamente as duas metades
    const sortedLeft = this.mergeSort(left);
    const sortedRight = this.mergeSort(right);

    // Combina as duas metades ordenadas
    return this.merge(sortedLeft, sortedRight);
  }

  merge(left, right) {
    const result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    // Compara elementos de ambos os arrays e adiciona o menor ao resultado
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

    // Adiciona os elementos restantes de ambos os arrays
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

module.exports = MergeSort;
