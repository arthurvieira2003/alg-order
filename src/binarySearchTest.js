const fs = require("fs");
const BinarySearch = require("./BinarySearch");
const { setupTracing } = require("./tracing");

// Configura o tracer
const tracer = setupTracing("busca-binaria");

/**
 * Lê os dados do arquivo para um array
 * @param {string} filename - Nome do arquivo de dados
 * @returns {Array} - Array com os dados lidos
 */
function readDataFromFile(filename) {
  const data = fs.readFileSync(filename, "utf8");
  return data
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map(Number);
}

/**
 * Testa a busca binária com um conjunto de valores aleatórios
 * @param {Array} sortedArray - Array ordenado onde realizar as buscas
 * @param {number} numSearches - Número de buscas a serem realizadas
 * @param {boolean} useCache - Se deve usar o cache ou não
 */
function testBinarySearch(sortedArray, numSearches = 1000, useCache = true) {
  const binarySearch = new BinarySearch();

  // Cria um span para todo o teste
  const testSpan = tracer.startSpan("binary_search_test", {
    attributes: {
      "array.length": sortedArray.length,
      "search.count": numSearches,
      "operation.type": "binary_search_benchmark",
      "cache.enabled": useCache,
    },
  });

  try {
    console.log(
      `\n-- Teste de Busca Binária Recursiva ${
        useCache ? "com Cache" : "sem Cache"
      } --`
    );
    console.log(`Array ordenado com ${sortedArray.length} elementos`);
    console.log(`Realizando ${numSearches} buscas...\n`);

    // Lista para armazenar estatísticas de cada busca
    const stats = {
      found: 0,
      notFound: 0,
      totalComparisons: 0,
      cacheHits: 0,
      cacheMisses: 0,
      executionTime: 0,
    };

    // Para demonstrar o benefício do cache, vamos repetir alguns valores
    // Criar um array para os valores a buscar
    const searchValues = [];

    // Conjunto para rastrear valores já escolhidos para busca
    const valueSet = new Set();

    // Gerar valores para busca com algumas repetições
    for (let i = 0; i < numSearches; i++) {
      let searchValue;

      // Para os primeiros 30% dos valores, escolher aleatoriamente
      if (i < numSearches * 0.3) {
        // Decide se vai buscar um valor que existe ou não no array
        if (Math.random() < 0.5) {
          // Escolhe um valor que existe no array
          const randomIndex = Math.floor(Math.random() * sortedArray.length);
          searchValue = sortedArray[randomIndex];
        } else {
          // Gera um valor aleatório que provavelmente não existe no array
          const min = sortedArray[0];
          const max = sortedArray[sortedArray.length - 1];
          const range = max - min;

          // Tenta gerar um valor fora do range do array
          if (Math.random() < 0.5) {
            searchValue = min - Math.random() * range * 0.2;
          } else {
            searchValue = max + Math.random() * range * 0.2;
          }
        }
        valueSet.add(searchValue);
      } else {
        // Para os 70% restantes, escolher valores já buscados anteriormente
        // para demonstrar o benefício do cache
        const existingValues = Array.from(valueSet);
        searchValue =
          existingValues[Math.floor(Math.random() * existingValues.length)];
      }

      searchValues.push(searchValue);
    }

    // Realizar as buscas
    for (let i = 0; i < numSearches; i++) {
      const searchValue = searchValues[i];

      // Cria um span para esta busca específica
      const searchSpan = tracer.startSpan(`search_${i + 1}`, {
        attributes: {
          "search.value": searchValue,
          "search.index": i,
        },
      });

      // Se não estiver usando cache, limpe-o antes de cada busca
      if (!useCache) {
        binarySearch.clearCache();
      }

      // Executa a busca e mede o tempo
      const startTime = performance.now();
      const result = binarySearch.search(sortedArray, searchValue);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Atualiza estatísticas
      stats.executionTime += executionTime;

      // Recupera estatísticas da busca
      const searchStats = binarySearch.getStats();
      stats.totalComparisons += searchStats.comparisons;
      stats.cacheHits += searchStats.cacheHits;
      stats.cacheMisses += searchStats.cacheMisses;

      if (result !== -1) {
        stats.found++;
      } else {
        stats.notFound++;
      }

      // Adiciona dados ao span e finaliza
      searchSpan.setAttributes({
        "execution.time_ms": executionTime,
        "operation.comparisons": searchStats.comparisons,
        "search.result_index": result,
        "search.found": result !== -1,
        "cache.hit": searchStats.cacheHits > 0,
      });
      searchSpan.end();

      // A cada 100 buscas, mostra o progresso
      if ((i + 1) % 100 === 0) {
        console.log(`Progresso: ${i + 1}/${numSearches} buscas realizadas`);
      }
    }

    // Calcula algumas estatísticas finais
    const avgComparisons = stats.totalComparisons / numSearches;
    const cacheHitRate = useCache
      ? (stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100
      : 0;
    const avgExecutionTime = stats.executionTime / numSearches;
    const cacheSize = Object.keys(binarySearch.cache).length;

    // Imprime resultados
    console.log("\n-- Resultados Finais --");
    console.log(`Total de buscas: ${numSearches}`);
    console.log(`Valores encontrados: ${stats.found}`);
    console.log(`Valores não encontrados: ${stats.notFound}`);
    console.log(`Média de comparações por busca: ${avgComparisons.toFixed(2)}`);

    if (useCache) {
      console.log(`Cache hits: ${stats.cacheHits}`);
      console.log(`Cache misses: ${stats.cacheMisses}`);
      console.log(`Taxa de acerto do cache: ${cacheHitRate.toFixed(2)}%`);
      console.log(`Tamanho final do cache: ${cacheSize} entradas`);
    }

    console.log(`Tempo médio de execução: ${avgExecutionTime.toFixed(6)} ms`);

    // Atualiza o span principal com os resultados
    testSpan.setAttributes({
      "values.found": stats.found,
      "values.not_found": stats.notFound,
      avg_comparisons: avgComparisons,
      "cache.hits": stats.cacheHits,
      "cache.misses": stats.cacheMisses,
      "cache.hit_rate": cacheHitRate,
      "cache.size": cacheSize,
      "avg_execution.time_ms": avgExecutionTime,
      success: true,
    });
    testSpan.end();

    // Retorna estatísticas para possível uso posterior
    return {
      arrayLength: sortedArray.length,
      searchCount: numSearches,
      cacheEnabled: useCache,
      found: stats.found,
      notFound: stats.notFound,
      avgComparisons: avgComparisons,
      cacheHits: stats.cacheHits,
      cacheMisses: stats.cacheMisses,
      cacheHitRate: cacheHitRate,
      cacheSize: cacheSize,
      avgExecutionTime: avgExecutionTime,
    };
  } catch (error) {
    // Em caso de erro, registra no span
    testSpan.setStatus({
      code: 2, // Error
      message: error.message,
    });
    testSpan.recordException(error);
    testSpan.end();
    console.error("Erro ao executar os testes:", error);
    throw error;
  }
}

/**
 * Salva os resultados em um arquivo JSON
 * @param {Object} results - Resultados dos testes
 * @param {string} filename - Nome do arquivo para salvar os resultados
 */
function saveResultsToFile(results, filename) {
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`Resultados salvos em ${filename}`);
}

/**
 * Função principal para executar os testes
 */
function main() {
  // Tamanhos de array a serem testados
  const dataSizes = [1000, 10000, 100000];

  const allResults = {
    timestamp: new Date().toISOString(),
    algorithm: "BinarySearchRecursive",
    withCache: [],
    withoutCache: [],
  };

  // Testes com cache habilitado
  for (const size of dataSizes) {
    const dataFile = `src/dados_${size}.txt`;
    console.log(`\nCarregando dados de ${dataFile}...`);

    // Lê dados do arquivo
    const data = readDataFromFile(dataFile);
    console.log(`Total de ${data.length} números carregados.`);

    // Os dados dos arquivos já estão ordenados, mas podemos garantir a ordenação
    data.sort((a, b) => a - b);

    // Executa o teste de busca binária com cache
    const results = testBinarySearch(data, 1000, true);

    // Adiciona aos resultados gerais
    allResults.withCache.push(results);
  }

  // Testes sem cache (para comparação)
  for (const size of dataSizes) {
    const dataFile = `src/dados_${size}.txt`;
    console.log(`\nCarregando dados de ${dataFile}...`);

    // Lê dados do arquivo
    const data = readDataFromFile(dataFile);
    console.log(`Total de ${data.length} números carregados.`);

    // Os dados dos arquivos já estão ordenados, mas podemos garantir a ordenação
    data.sort((a, b) => a - b);

    // Executa o teste de busca binária sem cache
    const results = testBinarySearch(data, 1000, false);

    // Adiciona aos resultados gerais
    allResults.withoutCache.push(results);
  }

  // Salva todos os resultados em um arquivo JSON
  saveResultsToFile(allResults, "src/resultados_busca_binaria.json");
}

// Executa a função principal
main();
