const { workerData, parentPort } = require("worker_threads");

// Função para realizar o QuickSort
function quickSort(arr, low, high, stats) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high, stats);
    quickSort(arr, low, pivotIndex - 1, stats);
    quickSort(arr, pivotIndex + 1, high, stats);
  }
}

// Função para particionar o array
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

// Executa o QuickSort no array recebido
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

  // Criamos uma cópia do array para não modificar o original
  const result = [...array];

  // Ordenamos o array
  quickSort(result, 0, result.length - 1, stats);

  // Enviamos o resultado de volta para o thread principal
  return {
    sortedArray: result,
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
  module.exports = { quickSort, processArray };
}
