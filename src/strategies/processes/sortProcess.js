/**
 * Script para ordenação em um processo separado
 */

// Implementação do MergeSort
function mergeSort(arr, stats) {
  if (arr.length <= 1) {
    return arr;
  }

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), stats);
  const right = mergeSort(arr.slice(mid), stats);

  return merge(left, right, stats);
}

function merge(left, right, stats) {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    stats.comparisons++;
    if (left[leftIndex] <= right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
    stats.swaps++;
  }

  while (leftIndex < left.length) {
    result.push(left[leftIndex]);
    leftIndex++;
    stats.swaps++;
  }

  while (rightIndex < right.length) {
    result.push(right[rightIndex]);
    rightIndex++;
    stats.swaps++;
  }

  return result;
}

// Implementação do QuickSort
function quickSort(arr, low, high, stats) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high, stats);
    quickSort(arr, low, pivotIndex - 1, stats);
    quickSort(arr, pivotIndex + 1, high, stats);
  }
  return arr;
}

function partition(arr, low, high, stats) {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    stats.comparisons++;
    if (arr[j] <= pivot) {
      i++;
      if (i !== j) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        stats.swaps++;
      }
    }
  }

  if (i + 1 !== high) {
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    stats.swaps++;
  }

  return i + 1;
}

// Função que executa a ordenação com o algoritmo especificado
function sortArray(array, algorithm = "mergesort") {
  const stats = {
    comparisons: 0,
    swaps: 0,
  };

  let sortedArray;

  switch (algorithm.toLowerCase()) {
    case "quicksort":
      sortedArray = quickSort([...array], 0, array.length - 1, stats);
      break;
    case "mergesort":
    default:
      sortedArray = mergeSort([...array], stats);
      break;
  }

  return {
    sortedArray,
    stats,
  };
}

// Escuta por mensagens do processo pai
process.on("message", (data) => {
  try {
    if (!data || !data.array) {
      throw new Error("Dados inválidos recebidos pelo processo filho");
    }

    const algorithm = data.algorithm || "mergesort";
    const result = sortArray(data.array, algorithm);

    // Envia o resultado de volta para o processo pai
    process.send(result);
  } catch (error) {
    // Envia o erro de volta para o processo pai
    process.send({ error: error.message });
  }
});
