const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");
const { trace } = require("@opentelemetry/api");

// Configura o nível de diagnóstico para OpenTelemetry
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Cria e configura o provedor de tracer
const provider = new NodeTracerProvider();

// Usa o exportador de console para visualizar spans no console
const exporter = new ConsoleSpanExporter();
const processor = new SimpleSpanProcessor(exporter);
provider.addSpanProcessor(processor);

// Registra o provedor com a API de tracer global
provider.register();

// Cria um tracer nomeado
const tracer = trace.getTracer("sort-algorithms-tracer");

/**
 * Cria e retorna um span para um algoritmo de ordenação
 * @param {string} algorithmName - Nome do algoritmo de ordenação
 * @param {number} arrayLength - Tamanho do array a ser ordenado
 * @returns {object} - Objeto span da OpenTelemetry
 */
function createSortingSpan(algorithmName, arrayLength) {
  return tracer.startSpan(`sort_${algorithmName}`, {
    attributes: {
      "algorithm.name": algorithmName,
      "array.length": arrayLength,
    },
  });
}

/**
 * Adiciona atributos de resultado a um span e finaliza o span
 * @param {object} span - Objeto span da OpenTelemetry
 * @param {object} stats - Estatísticas do algoritmo
 */
function endSortingSpan(span, stats) {
  span.setAttributes({
    "execution.time_ms": stats.executionTime,
    "operation.comparisons": stats.comparisons,
    "operation.swaps": stats.swaps,
  });
  span.end();
}

module.exports = {
  tracer,
  createSortingSpan,
  endSortingSpan,
};
