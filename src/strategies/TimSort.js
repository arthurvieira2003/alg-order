const SortStrategy = require("./SortStrategy");

class TimSort extends SortStrategy {
  constructor() {
    super();
    this.RUN = 32; // Tamanho do RUN para insertion sort
  }

  getName() {
    return "Tim Sort";
  }

  sort(array) {
    this.resetStats();
    const n = array.length;
    const result = [...array]; // Cria uma cópia do array

    // Ordena subarrays individuais de tamanho RUN
    for (let i = 0; i < n; i += this.RUN) {
      this.insertionSort(result, i, Math.min(i + this.RUN - 1, n - 1));
    }

    // Começa a mesclar a partir do tamanho RUN
    for (let size = this.RUN; size < n; size = 2 * size) {
      // Escolhe o ponto de partida do subarray esquerdo. size é o tamanho do merge
      for (let left = 0; left < n; left += 2 * size) {
        // Encontra o ponto final do subarray esquerdo
        const mid = Math.min(n - 1, left + size - 1);

        // Encontra o ponto final do subarray direito
        const right = Math.min(n - 1, left + 2 * size - 1);

        // Mescla subarrays result[left...mid] e result[mid+1...right]
        if (mid < right) {
          this.merge(result, left, mid, right);
        }
      }
    }

    return result;
  }

  // Função de insertion sort para pequenos subarrays
  insertionSort(arr, left, right) {
    for (let i = left + 1; i <= right; i++) {
      const temp = arr[i];
      let j = i - 1;

      while (j >= left) {
        this.comparisons++;
        if (arr[j] > temp) {
          arr[j + 1] = arr[j];
          this.swaps++;
          j--;
        } else {
          break;
        }
      }

      arr[j + 1] = temp;
      if (j + 1 !== i) this.swaps++;
    }
  }

  // Função para mesclar dois subarrays ordenados
  merge(arr, left, mid, right) {
    // Calcula os tamanhos dos subarrays a serem mesclados
    const len1 = mid - left + 1;
    const len2 = right - mid;

    // Cria arrays temporários
    const leftArr = new Array(len1);
    const rightArr = new Array(len2);

    // Copia os dados para os arrays temporários
    for (let i = 0; i < len1; i++) {
      leftArr[i] = arr[left + i];
    }

    for (let i = 0; i < len2; i++) {
      rightArr[i] = arr[mid + 1 + i];
    }

    // Mescla os arrays temporários de volta em arr[left...right]
    let i = 0,
      j = 0,
      k = left;

    while (i < len1 && j < len2) {
      this.comparisons++;
      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      this.swaps++;
      k++;
    }

    // Copia os elementos restantes de leftArr, se houver
    while (i < len1) {
      arr[k] = leftArr[i];
      this.swaps++;
      i++;
      k++;
    }

    // Copia os elementos restantes de rightArr, se houver
    while (j < len2) {
      arr[k] = rightArr[j];
      this.swaps++;
      j++;
      k++;
    }
  }
}

module.exports = TimSort;
