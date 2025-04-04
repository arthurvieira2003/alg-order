const { Worker } = require("worker_threads");

/**
 * Classe que gerencia um pool de workers para processamento paralelo
 */
class WorkerPool {
  /**
   * Cria um pool de workers
   * @param {string} workerScript - Caminho para o script do worker
   * @param {number} numWorkers - Número de workers no pool
   */
  constructor(workerScript, numWorkers) {
    this.workerScript = workerScript;
    this.numWorkers = numWorkers;
    this.workers = [];
    this.taskQueue = [];
    this.freeWorkers = [];

    // Inicializa os workers
    this.initialize();
  }

  /**
   * Inicializa o pool de workers
   */
  initialize() {
    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker(this.workerScript);

      worker.on("message", (result) => {
        // Obtém e completa a tarefa atual do worker
        const currentTask = worker.currentTask;
        worker.currentTask = null;
        currentTask.resolve(result);

        // Coloca o worker de volta no pool
        this.freeWorkers.push(worker);

        // Processa a próxima tarefa, se houver
        this.processNextTask();
      });

      worker.on("error", (error) => {
        // Rejeita a tarefa atual em caso de erro
        if (worker.currentTask) {
          worker.currentTask.reject(error);
          worker.currentTask = null;
        }
      });

      worker.currentTask = null;
      this.freeWorkers.push(worker);
      this.workers.push(worker);
    }
  }

  /**
   * Processa a próxima tarefa na fila
   */
  processNextTask() {
    if (this.taskQueue.length === 0 || this.freeWorkers.length === 0) {
      return;
    }

    const worker = this.freeWorkers.pop();
    const task = this.taskQueue.shift();

    worker.currentTask = task;
    worker.postMessage({ array: task.data.array });
  }

  /**
   * Executa uma tarefa no pool
   * @param {Object} data - Dados para enviar ao worker
   * @returns {Promise} - Promise que resolve quando a tarefa for concluída
   */
  runTask(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };

      this.taskQueue.push(task);
      this.processNextTask();
    });
  }

  /**
   * Finaliza o pool de workers
   */
  async terminate() {
    // Aguarda a conclusão de todas as tarefas
    while (
      this.taskQueue.length > 0 ||
      this.freeWorkers.length < this.numWorkers
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Termina todos os workers
    for (const worker of this.workers) {
      await worker.terminate();
    }

    this.workers = [];
    this.freeWorkers = [];
  }
}

module.exports = WorkerPool;
