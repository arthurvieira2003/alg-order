/**
 * Interface para estratégias de ordenação
 */
class SortStrategy {
  constructor() {
    this.comparisons = 0;
    this.swaps = 0;
    this.currentSpan = null;
    this.traceEnabled = false;
  }

  /**
   * Nome do algoritmo de ordenação
   * @returns {string}
   */
  getName() {
    throw new Error("O método getName() deve ser implementado");
  }

  /**
   * Método para ordenar um array
   * @param {Array} array - Array a ser ordenado
   * @returns {Array} - Array ordenado
   */
  sort(array) {
    throw new Error("O método sort() deve ser implementado");
  }

  /**
   * Reseta os contadores de estatísticas
   */
  resetStats() {
    this.comparisons = 0;
    this.swaps = 0;
  }

  /**
   * Registra uma comparação entre elementos
   * @param {any} a - Primeiro elemento
   * @param {any} b - Segundo elemento
   * @param {number} indexA - Índice do primeiro elemento (opcional)
   * @param {number} indexB - Índice do segundo elemento (opcional)
   * @returns {boolean} - Resultado da comparação (a > b)
   */
  compare(a, b, indexA = null, indexB = null) {
    this.comparisons++;

    // Adiciona evento de comparação se o tracing estiver habilitado
    if (this.traceEnabled && this.currentSpan) {
      // Limita o registro de eventos para não sobrecarregar o tracer
      if (this.comparisons % 1000 === 0 || this.comparisons <= 10) {
        this.currentSpan.addEvent("comparison", {
          count: this.comparisons,
          ...(indexA !== null ? { index_a: indexA } : {}),
          ...(indexB !== null ? { index_b: indexB } : {}),
          value_a: a,
          value_b: b,
          result: a > b,
        });
      }
    }

    return a > b;
  }

  /**
   * Registra uma troca entre elementos
   * @param {Array} array - Array onde a troca ocorre
   * @param {number} i - Índice do primeiro elemento
   * @param {number} j - Índice do segundo elemento
   */
  swap(array, i, j) {
    this.swaps++;

    // Adiciona evento de troca se o tracing estiver habilitado
    if (this.traceEnabled && this.currentSpan) {
      // Limita o registro de eventos para não sobrecarregar o tracer
      if (this.swaps % 1000 === 0 || this.swaps <= 10) {
        this.currentSpan.addEvent("swap", {
          count: this.swaps,
          index_a: i,
          index_b: j,
          value_a: array[i],
          value_b: array[j],
        });
      }
    }

    [array[i], array[j]] = [array[j], array[i]];
  }

  /**
   * Configura o span atual para rastreamento
   * @param {object} span - Span do OpenTelemetry
   */
  setSpan(span) {
    this.currentSpan = span;
    this.traceEnabled = true;
  }

  /**
   * Adiciona um evento ao span atual
   * @param {string} name - Nome do evento
   * @param {object} attributes - Atributos do evento
   */
  addEvent(name, attributes = {}) {
    if (this.traceEnabled && this.currentSpan) {
      this.currentSpan.addEvent(name, attributes);
    }
  }

  /**
   * Retorna as estatísticas do algoritmo
   * @returns {Object} - Objeto com estatísticas
   */
  getStats() {
    return {
      comparisons: this.comparisons,
      swaps: this.swaps,
    };
  }
}

module.exports = SortStrategy;
