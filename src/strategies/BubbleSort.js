const SortStrategy = require("./SortStrategy");

class BubbleSort extends SortStrategy {
  getName() {
    return "Bubble Sort";
  }

  sort(array) {
    this.resetStats();
    const n = array.length;
    const result = [...array]; // Cria uma cópia do array

    this.addEvent("sort_started", {
      array_length: n,
      algorithm: this.getName(),
    });

    for (let i = 0; i < n; i++) {
      this.addEvent("outer_loop_iteration", {
        iteration: i,
        remaining_passes: n - i,
      });

      for (let j = 0; j < n - i - 1; j++) {
        this.comparisons++;
        if (result[j] > result[j + 1]) {
          // Troca os elementos
          this.swap(result, j, j + 1);
          this.swaps++;
        }
      }

      // Adicionando evento de progresso a cada 10% ou nas primeiras iterações
      if (i % Math.max(1, Math.floor(n / 10)) === 0 || i < 5) {
        this.addEvent("progress", {
          completed_iterations: i + 1,
          total_iterations: n,
          progress_percent: (((i + 1) / n) * 100).toFixed(2),
        });
      }
    }

    this.addEvent("sort_completed", {
      comparisons: this.comparisons,
      swaps: this.swaps,
    });

    return result;
  }
}

module.exports = BubbleSort;
