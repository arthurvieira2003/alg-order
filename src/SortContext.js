/**
 * Contexto que utiliza estratégias de ordenação
 */
class SortContext {
  constructor(strategy = null, tracer = null) {
    this.strategy = strategy;
    this.tracer = tracer;
  }

  /**
   * Define a estratégia de ordenação
   * @param {Object} strategy - Implementação de SortStrategy
   */
  setStrategy(strategy) {
    this.strategy = strategy;
  }

  /**
   * Define o tracer para telemetria
   * @param {Object} tracer - Tracer do OpenTelemetry
   */
  setTracer(tracer) {
    this.tracer = tracer;
  }

  /**
   * Executa a estratégia de ordenação
   * @param {Array} array - Array a ser ordenado
   * @returns {Object} - Resultado da ordenação e estatísticas
   */
  executeStrategy(array) {
    if (!this.strategy) {
      throw new Error("Estratégia de ordenação não definida");
    }

    // Cria um span para o algoritmo de ordenação, se tracer estiver disponível
    let span = null;
    if (this.tracer) {
      const algorithmName = this.strategy.getName();
      span = this.tracer.startSpan(`sort_${algorithmName}`, {
        attributes: {
          "algorithm.name": algorithmName,
          "array.length": array.length,
          "operation.type": "sorting",
        },
      });

      // Configura o span no objeto de estratégia
      this.strategy.setSpan(span);
    }

    try {
      // Marca o tempo inicial
      const startTime = performance.now();

      // Executa o algoritmo de ordenação
      const sortedArray = this.strategy.sort(array);

      // Marca o tempo final
      const endTime = performance.now();

      // Calcula o tempo de execução em milissegundos
      const executionTime = endTime - startTime;

      // Obtém estatísticas da estratégia
      const stats = this.strategy.getStats();

      // Adiciona métricas ao span e finaliza, se disponível
      if (span) {
        span.setAttributes({
          "execution.time_ms": executionTime,
          "operation.comparisons": stats.comparisons,
          "operation.swaps": stats.swaps,
          success: true,
        });
        span.end();
      }

      return {
        algorithmName: this.strategy.getName(),
        sortedArray,
        stats: {
          ...stats,
          executionTime,
          arrayLength: array.length,
        },
      };
    } catch (error) {
      // Registra erro no span, se disponível
      if (span) {
        span.setStatus({
          code: 2, // Error
          message: error.message,
        });
        span.recordException(error);
        span.setAttributes({
          success: false,
        });
        span.end();
      }

      throw error;
    }
  }
}

module.exports = SortContext;
