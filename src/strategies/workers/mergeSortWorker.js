const { workerData, parentPort } = require("worker_threads");

// Função para realizar o MergeSort
function mergeSort(arr, stats) {
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
  const sortedLeft = mergeSort(left, stats);
  const sortedRight = mergeSort(right, stats);

  // Combina as duas metades ordenadas
  return merge(sortedLeft, sortedRight, stats);
}

// Função para mesclar dois arrays ordenados
function merge(left, right, stats) {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  // Compara elementos de ambos os arrays e adiciona o menor ao resultado
  while (leftIndex < left.length && rightIndex < right.length) {
    stats.comparisons++;
    if (left[leftIndex] <= right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
    stats.swaps++; // Cada inserção é considerada uma movimentação
  }

  // Adiciona os elementos restantes de ambos os arrays
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

// Executa o MergeSort no array recebido
function processArray(data) {
  let array;

  // Verifica se os dados vieram via workerData ou mensagem
  if (workerData && workerData.array) {
    array = workerData.array;
  } else if (data && data.array) {
    array = data.array;
  } else {
    throw new Error("Array de dados não fornecido");
  }

  // Estatísticas para contagem
  const stats = {
    comparisons: 0,
    swaps: 0,
  };

  // Ordenamos o array
  const sortedArray = mergeSort(array, stats);

  // Retornamos o resultado
  return {
    sortedArray,
    stats,
  };
}

// Se iniciado como worker via worker_threads, processa a mensagem
if (parentPort) {
  // Verificamos se já temos dados no workerData
  if (workerData && workerData.array) {
    parentPort.postMessage(processArray());
  } else {
    // Caso contrário, aguardamos a mensagem
    parentPort.on("message", (data) => {
      try {
        const result = processArray(data);
        parentPort.postMessage(result);
      } catch (error) {
        parentPort.postMessage({ error: error.message });
      }
    });
  }
} else {
  // Caso contrário, pode ser usado como módulo
  module.exports = { mergeSort, processArray };
}
