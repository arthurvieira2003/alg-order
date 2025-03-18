// Configuração da instrumentação OpenTelemetry com exportador Jaeger
const { Resource } = require("@opentelemetry/resources");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { trace } = require("@opentelemetry/api");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");

/**
 * Configura o tracer do OpenTelemetry com exportador Jaeger
 * @param {string} serviceName - Nome do serviço para identificação no Jaeger
 */
function setupTracing(serviceName = "algoritmos-ordenacao") {
  // Cria um recurso que identifica nossa aplicação no Jaeger
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
  });

  // Configura o exportador Jaeger
  const jaegerExporter = new JaegerExporter({
    endpoint: "http://localhost:14268/api/traces",
  });

  // Cria um provedor de tracer para o ambiente Node.js
  const provider = new NodeTracerProvider({
    resource: resource,
  });

  // Adiciona o exportador Jaeger ao provedor de tracer
  provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));

  // Registra o provedor globalmente
  provider.register();

  // Registra instrumentações automáticas
  registerInstrumentations({
    instrumentations: [
      getNodeAutoInstrumentations({
        // Você pode configurar aqui as instrumentações específicas
      }),
    ],
  });

  console.log(
    "Tracing configurado com Jaeger. Verifique em http://localhost:16686"
  );

  // Retorna o tracer que será usado na aplicação
  return trace.getTracer(serviceName);
}

/**
 * Cria e retorna um span para um algoritmo de ordenação
 * @param {object} tracer - Tracer do OpenTelemetry
 * @param {string} algorithmName - Nome do algoritmo de ordenação
 * @param {number} arrayLength - Tamanho do array a ser ordenado
 * @returns {object} - Objeto span da OpenTelemetry
 */
function createSortingSpan(tracer, algorithmName, arrayLength) {
  return tracer.startSpan(`sort_${algorithmName}`, {
    attributes: {
      "algorithm.name": algorithmName,
      "array.length": arrayLength,
      "operation.type": "sorting",
    },
  });
}

/**
 * Adiciona eventos de etapas intermediárias a um span
 * @param {object} span - Objeto span da OpenTelemetry
 * @param {string} step - Nome da etapa
 * @param {object} attributes - Atributos adicionais para o evento
 */
function addStepEvent(span, step, attributes = {}) {
  span.addEvent(step, attributes);
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
    success: true,
  });
  span.end();
}

/**
 * Cria um span de erro e o finaliza
 * @param {object} span - Objeto span da OpenTelemetry
 * @param {Error} error - Objeto de erro
 */
function recordErrorToSpan(span, error) {
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

module.exports = {
  setupTracing,
  createSortingSpan,
  addStepEvent,
  endSortingSpan,
  recordErrorToSpan,
};
