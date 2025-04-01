/**
 * Classe que implementa um algoritmo de busca binária recursiva com cache
 */
class BinarySearch {
  constructor() {
    // Inicializa o cache como um objeto vazio (hashtable)
    this.cache = {};
    this.comparisons = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Reseta as estatísticas de busca
   */
  resetStats() {
    this.comparisons = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Retorna as estatísticas atuais de busca
   * @returns {Object} Estatísticas de busca
   */
  getStats() {
    return {
      comparisons: this.comparisons,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheSize: Object.keys(this.cache).length,
    };
  }

  /**
   * Limpa o cache de buscas
   */
  clearCache() {
    this.cache = {};
  }

  /**
   * Busca um valor em um array ordenado, utilizando cache para resultados anteriores
   * @param {Array} array - Array ordenado para realizar a busca
   * @param {number} target - Valor a ser buscado
   * @returns {number} - Índice do valor no array ou -1 se não encontrado
   */
  search(array, target) {
    this.resetStats();

    // Gera uma chave única para o cache
    // Usa o target e o tamanho do array como identificador
    // (na prática real, poderia usar um hash do array para casos mais complexos)
    const cacheKey = `${target}_${array.length}`;

    // Verifica se o resultado já está no cache
    if (this.cache.hasOwnProperty(cacheKey)) {
      this.cacheHits++;
      return this.cache[cacheKey];
    }

    this.cacheMisses++;
    // Se não estiver no cache, realiza a busca binária recursiva
    const result = this._binarySearchRecursive(
      array,
      target,
      0,
      array.length - 1
    );

    // Armazena o resultado no cache para uso futuro
    this.cache[cacheKey] = result;

    return result;
  }

  /**
   * Implementação recursiva do algoritmo de busca binária
   * @param {Array} array - Array ordenado para realizar a busca
   * @param {number} target - Valor a ser buscado
   * @param {number} left - Índice esquerdo do subarray atual
   * @param {number} right - Índice direito do subarray atual
   * @returns {number} - Índice do valor no array ou -1 se não encontrado
   * @private
   */
  _binarySearchRecursive(array, target, left, right) {
    // Caso base: subarray vazio (valor não encontrado)
    if (left > right) {
      return -1;
    }

    // Calcula o índice do meio do subarray atual
    const mid = Math.floor((left + right) / 2);
    this.comparisons++;

    // Caso base: valor encontrado
    if (array[mid] === target) {
      return mid;
    }

    // Decide qual metade do array continuar a busca
    if (array[mid] > target) {
      // Busca na metade esquerda
      return this._binarySearchRecursive(array, target, left, mid - 1);
    } else {
      // Busca na metade direita
      return this._binarySearchRecursive(array, target, mid + 1, right);
    }
  }
}

module.exports = BinarySearch;
