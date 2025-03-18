const SortStrategy = require("./SortStrategy");

class RadixSort extends SortStrategy {
  getName() {
    return "Radix Sort";
  }

  sort(array) {
    this.resetStats();
    const n = array.length;
    const result = [...array]; // Cria uma cópia do array

    // Encontra o número máximo para saber o número de dígitos
    let max = Math.abs(result[0]);
    for (let i = 1; i < n; i++) {
      this.comparisons++;
      if (Math.abs(result[i]) > max) {
        max = Math.abs(result[i]);
      }
    }

    // Verifica se há números negativos
    let hasNegative = false;
    for (let i = 0; i < n; i++) {
      this.comparisons++;
      if (result[i] < 0) {
        hasNegative = true;
        break;
      }
    }

    // Se houver números negativos, processa os positivos e negativos separadamente
    if (hasNegative) {
      const positiveNums = result.filter((num) => num >= 0);
      const negativeNums = result
        .filter((num) => num < 0)
        .map((num) => Math.abs(num));

      // Ordena positivos e negativos separadamente
      const sortedPositive = this.radixSortPositive(positiveNums);
      const sortedNegative = this.radixSortPositive(negativeNums)
        .map((num) => -num)
        .reverse();

      // Combina os resultados
      return [...sortedNegative, ...sortedPositive];
    } else {
      // Se todos forem positivos, aplica o radix sort diretamente
      return this.radixSortPositive(result);
    }
  }

  // Função auxiliar para ordenar números positivos
  radixSortPositive(arr) {
    const n = arr.length;

    // Encontra o número máximo para saber o número de dígitos
    let max = arr[0];
    for (let i = 1; i < n; i++) {
      this.comparisons++;
      if (arr[i] > max) {
        max = arr[i];
      }
    }

    // Faz a ordenação por contagem para cada dígito
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      this.countSort(arr, exp);
    }

    return arr;
  }

  // Função auxiliar para ordenação por contagem baseada em um dígito específico
  countSort(arr, exp) {
    const n = arr.length;
    const output = new Array(n).fill(0);
    const count = new Array(10).fill(0);

    // Conta a ocorrência de cada dígito
    for (let i = 0; i < n; i++) {
      const digit = Math.floor(arr[i] / exp) % 10;
      count[digit]++;
    }

    // Altera count[i] para que contenha a posição real
    // deste dígito no array de saída
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }

    // Constrói o array de saída
    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(arr[i] / exp) % 10;
      output[count[digit] - 1] = arr[i];
      count[digit]--;
      this.swaps++;
    }

    // Copia o array de saída para o array original
    for (let i = 0; i < n; i++) {
      arr[i] = output[i];
    }
  }
}

module.exports = RadixSort;
