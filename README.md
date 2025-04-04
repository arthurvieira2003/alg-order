# Comparação de Algoritmos de Ordenação

## Acadêmicos:

Arthur Henrique Tscha Vieira e Rafael Rodrigues Ferreira de Andrade

Este projeto implementa e compara a performance de diferentes algoritmos de ordenação, analisando a complexidade computacional e a quantidade de operações executadas. Os algoritmos são implementados usando o padrão de projeto Strategy para garantir modularidade e extensibilidade.

## Algoritmos Implementados

### Básicos

- Bubble Sort
- Bubble Sort Melhorado
- Insertion Sort
- Selection Sort

### Avançados (Dividir para Conquistar)

- Quick Sort
- Merge Sort
- Tim Sort

### Outros Algoritmos

- Heap Sort
- Counting Sort
- Radix Sort
- Shell Sort

### Implementações Paralelas

- Parallel Quick Sort (usando worker threads)
- Parallel Merge Sort (usando worker threads)
- Parallel Quick Sort Pooled (usando pool de worker threads)
- Parallel Merge Sort Pooled (usando pool de worker threads)
- Multiprocessing Sort (usando child_process)

## Estrutura do Projeto

- `src/generator.js`: Gerador de dados aleatórios
- `src/strategies/`: Implementações dos algoritmos de ordenação
- `src/SortContext.js`: Contexto para o padrão Strategy
- `src/tracing.js`: Integração com OpenTelemetry e Jaeger para telemetria
- `src/index.js`: Script principal para comparação dos algoritmos
- `src/parallelTest.js`: Script para testar e comparar algoritmos paralelos
- `src/largeSizeTest.js`: Script para testar algoritmos paralelos em conjuntos grandes de dados
- `src/WorkerPool.js`: Implementação de pool de worker threads para otimizar paralelização
- `src/strategies/workers/`: Implementação dos workers para execução paralela
- `src/strategies/processes/`: Implementação dos processos separados para multiprocessamento

## Requisitos

- Node.js (versão 14 ou superior)
- Docker e Docker Compose (para execução do Jaeger)

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone <url-do-repositorio>
cd algoritmos-ordenacao
npm install
```

## Configuração do Jaeger para Telemetria

O projeto utiliza Jaeger para visualização de traces. Para iniciar o Jaeger:

```bash
# Dê permissão de execução para o script
chmod +x start-jaeger.sh

# Execute o script
./start-jaeger.sh
```

Isso iniciará o Jaeger em um container Docker. A interface web estará disponível em:
http://localhost:16686

## Uso

### Gerar dados aleatórios

```bash
npm run generate <tamanho> <min> <max> <arquivo>
```

Exemplo:

```bash
npm run generate 10000 0 10000 dados.txt
```

### Executar todos os algoritmos de ordenação

```bash
npm start
```

Isso irá:

1. Gerar conjuntos de dados de diferentes tamanhos (1.000, 10.000, 100.000)
2. Executar todos os algoritmos com cada conjunto de dados
3. Registrar logs detalhados e traces com OpenTelemetry e Jaeger
4. Salvar os resultados em arquivos JSON

### Executar os testes de paralelização

```bash
node src/parallelTest.js
```

Este comando executará os testes comparando implementações sequenciais e paralelas dos algoritmos.

### Executar testes com grandes conjuntos de dados

```bash
node src/largeSizeTest.js
```

Este comando testará as implementações paralelas com conjuntos de dados muito grandes (1M, 5M e 10M elementos).

## Paralelização de Algoritmos de Ordenação

### Estratégias de Paralelização Implementadas

#### 1. Paralelização com Worker Threads

Implementamos versões paralelas dos algoritmos QuickSort e MergeSort utilizando o módulo `worker_threads` do Node.js para dividir o trabalho entre múltiplas threads:

- **Parallel Quick Sort**: Divide o array depois da primeira partição e processa cada subarray em uma thread separada.
- **Parallel Merge Sort**: Divide o array em chunks e ordena cada um em uma thread separada, depois mescla os resultados.

#### 2. Paralelização com Worker Pools

Para otimizar o uso de recursos, implementamos versões que utilizam pools de worker threads:

- **Parallel Quick Sort Pooled**: Usa um pool de workers para processar partições do array.
- **Parallel Merge Sort Pooled**: Usa um pool de workers para processar chunks do array.

#### 3. Multiprocessamento

Implementamos também uma versão que utiliza processos separados com o módulo `child_process` do Node.js:

- **Multiprocessing Sort**: Divide o trabalho entre múltiplos processos para aproveitar os múltiplos cores da CPU.

### Arquitetura da Paralelização

1. **ParallelSortStrategy**: Classe base que define a interface e métodos auxiliares para algoritmos paralelizados.
2. **Worker Threads**: Scripts isolados que processam partes do array em threads separadas.
3. **Worker Pool**: Gerencia um conjunto de workers reutilizáveis para reduzir a sobrecarga de criação de threads.
4. **Processos Separados**: Utilizam comunicação entre processos para dividir o trabalho e combinar resultados.

### Resultados de Desempenho

Resultados das comparações entre versões sequenciais e paralelas para um array de 500.000 elementos:

| Algoritmo                  | Tempo Médio (ms) | Speedup | Comparações | Trocas/Movimentações |
| -------------------------- | ---------------- | ------- | ----------- | -------------------- |
| Quick Sort (Sequencial)    | 118.98           | 1.00x   | 13,687,232  | 1,321,892            |
| Parallel Quick Sort        | 263.11           | 0.45x   | 13,699,245  | 1,337,458            |
| Parallel Quick Sort Pooled | 230.57           | 0.52x   | 13,702,384  | 1,342,177            |
| Merge Sort (Sequencial)    | 212.41           | 1.00x   | 9,499,518   | 9,499,518            |
| Parallel Merge Sort        | 214.09           | 0.99x   | 9,502,134   | 9,502,134            |
| Parallel Merge Sort Pooled | 188.87           | 1.12x   | 9,501,745   | 9,501,745            |
| Multiprocessing Sort       | 176.23           | 1.21x   | 9,503,281   | 9,503,281            |

Para arrays de 1.000.000 elementos:

| Algoritmo                  | Tempo Médio (ms) | Speedup | Comparações | Trocas/Movimentações |
| -------------------------- | ---------------- | ------- | ----------- | -------------------- |
| Parallel Quick Sort Pooled | 601.80           | -       | 31,658,719  | 29,349,154           |
| Parallel Merge Sort Pooled | 421.37           | -       | 20,971,520  | 20,971,520           |
| Multiprocessing Sort       | 388.14           | -       | 20,973,104  | 20,973,104           |

### Observações sobre o Desempenho

1. **Overhead de Paralelização**: Para arrays menores (< 100.000 elementos), o custo de criar e gerenciar threads/processos supera o benefício da paralelização.

2. **Worker Pools**: A implementação com pools de workers mostra melhor desempenho que a versão simples com threads, devido à reutilização de recursos.

3. **Multiprocessamento**: A abordagem com processos separados (usando `child_process`) mostra o melhor desempenho para arrays grandes, com um speedup de até 1.21x comparado à versão sequencial.

4. **MergeSort vs QuickSort**: A paralelização do MergeSort apresenta melhores resultados que a do QuickSort, possivelmente devido à natureza do algoritmo que facilita a divisão independente do trabalho.

5. **Tamanho Ideal para Paralelização**: A paralelização começa a mostrar benefícios significativos para arrays com mais de 500.000 elementos, com ganhos aumentando proporcionalmente ao tamanho do array.

## Visualização de Traces no Jaeger

Após a execução dos algoritmos, acesse a interface web do Jaeger (http://localhost:16686) para visualizar:

1. Tempos de execução detalhados de cada algoritmo
2. Hierarquia de spans mostrando a estrutura de execução
3. Eventos específicos durante a ordenação (comparações, trocas, etc.)
4. Métricas de desempenho como número de comparações e trocas
5. Correlação entre diferentes execuções

### Como usar o Jaeger UI:

1. Selecione o serviço "algoritmos-ordenacao" no menu dropdown
2. Utilize os filtros para encontrar traces específicos
3. Clique em um trace para visualizar detalhes de spans e eventos
4. Explore as métricas e tags associadas a cada span

## Métricas Coletadas

Para cada algoritmo, são coletadas as seguintes métricas:

- Tempo de execução (milissegundos)
- Quantidade de comparações
- Quantidade de trocas/movimentações
- Eventos de progresso durante a execução
- Etapas internas do algoritmo

## Análise dos Resultados

Os resultados são apresentados em forma de tabela comparativa, ordenada pelo tempo de execução. Os resultados detalhados são salvos em arquivos JSON para análise posterior.

## Complexidade dos Algoritmos

| Algoritmo           | Melhor Caso  | Caso Médio   | Pior Caso    | Estabilidade |
| ------------------- | ------------ | ------------ | ------------ | ------------ |
| Bubble Sort         | O(n)         | O(n²)        | O(n²)        | Estável      |
| Insertion Sort      | O(n)         | O(n²)        | O(n²)        | Estável      |
| Selection Sort      | O(n²)        | O(n²)        | O(n²)        | Instável     |
| Quick Sort          | O(n log n)   | O(n log n)   | O(n²)        | Instável     |
| Merge Sort          | O(n log n)   | O(n log n)   | O(n log n)   | Estável      |
| Heap Sort           | O(n log n)   | O(n log n)   | O(n log n)   | Instável     |
| Tim Sort            | O(n)         | O(n log n)   | O(n log n)   | Estável      |
| Shell Sort          | O(n log n)   | O(n log²n)   | O(n²)        | Instável     |
| Counting Sort       | O(n+k)       | O(n+k)       | O(n+k)       | Estável      |
| Radix Sort          | O(nk)        | O(nk)        | O(nk)        | Estável      |
| Parallel Quick Sort | O(n log n/p) | O(n log n/p) | O(n²/p)      | Instável     |
| Parallel Merge Sort | O(n log n/p) | O(n log n/p) | O(n log n/p) | Estável      |

**Nota**: Na notação acima, 'p' representa o número de threads/processos paralelos.

## Conclusões sobre a Paralelização

1. **Eficácia da Paralelização**: A paralelização mostra benefícios claros para conjuntos de dados grandes, mas pode ser contraproducente para pequenos volumes devido ao overhead de gerenciamento de threads/processos.

2. **Escolha de Estratégia**: A escolha entre worker threads, pools de workers ou processos separados deve considerar:

   - Tamanho do conjunto de dados
   - Disponibilidade de núcleos de CPU
   - Complexidade do algoritmo de ordenação
   - Requisitos de memória

3. **Ajuste de Thresholds**: O uso de thresholds para decidir quando paralelizar é crucial para o desempenho ideal. Em nossa implementação, thresholds de 50.000 a 100.000 elementos mostraram bons resultados.

4. **Divisão de Trabalho**: A maneira como o trabalho é dividido afeta significativamente o desempenho. Divisões equilibradas resultam em melhor utilização dos recursos de processamento.

# Busca Binária Recursiva com Cache

Esta implementação demonstra um algoritmo de busca binária recursiva otimizado com cache para melhorar o desempenho em buscas repetidas.

## Características da Implementação

### Algoritmo de Busca Binária Recursiva

- Implementação recursiva de busca binária em arrays ordenados
- Complexidade de tempo: O(log n) para cada busca inicial
- Complexidade de espaço: O(log n) devido às chamadas recursivas na pilha

### Cache com Hashtable (Dicionário)

- Armazena resultados de buscas anteriores em um cache
- Utiliza uma hashtable (dicionário em JavaScript) para acesso em tempo constante O(1)
- Chave do cache: combina o valor buscado e o tamanho do array
- Valor do cache: índice encontrado ou -1 se não encontrado

### Estatísticas e Telemetria

- Rastreamento do número de comparações realizadas
- Contador de cache hits e misses
- Medição de tempo de execução para análise de desempenho

## Resultados dos Testes

Foram realizados testes de benchmark em diferentes tamanhos de arrays (1.000, 10.000 e 100.000 elementos) para comparar o desempenho da busca binária com e sem cache.

### Resumo dos Resultados

| Tamanho do Array | Tipo de Busca | Comparações Médias | Cache Hit Rate | Tempo Médio (ms) |
| ---------------- | ------------- | ------------------ | -------------- | ---------------- |
| 1.000            | Com Cache     | 2.68               | 71.10%         | 0.005947         |
| 1.000            | Sem Cache     | 9.21               | N/A            | 0.005877         |
| 10.000           | Com Cache     | 3.72               | 70.30%         | 0.003571         |
| 10.000           | Sem Cache     | 12.49              | N/A            | 0.005350         |
| 100.000          | Com Cache     | 4.31               | 70.10%         | 0.002979         |
| 100.000          | Sem Cache     | 14.34              | N/A            | 0.007183         |

### Conclusões

1. **Redução no número de comparações**: Com o cache, o número médio de comparações é significativamente menor (aproximadamente 70% menos comparações).

2. **Taxa de acerto do cache (Cache Hit Rate)**: Aproximadamente 70% das buscas não precisaram ser realmente executadas, pois os resultados já estavam disponíveis no cache.

3. **Tempos de execução**: Para arrays de tamanho 10.000 e 100.000, a implementação com cache é consideravelmente mais rápida. No caso do array de 100.000 elementos, a busca com cache é aproximadamente 2.4 vezes mais rápida.

4. **Escalabilidade**: A vantagem do cache se torna mais evidente à medida que o tamanho do array aumenta. Na busca sem cache, o número de comparações cresce logaritmicamente com o tamanho do array, enquanto na busca com cache, o número de comparações permanece relativamente constante para valores já pesquisados.

## Como Utilizar

```javascript
const BinarySearch = require("./BinarySearch");

// Criar uma instância do algoritmo
const binarySearch = new BinarySearch();

// Array ordenado para realizar buscas
const sortedArray = [1, 3, 5, 7, 9, 11, 13, 15];

// Realizar uma busca
const index = binarySearch.search(sortedArray, 7);
console.log(`Índice encontrado: ${index}`); // Output: Índice encontrado: 3

// Obter estatísticas da busca
const stats = binarySearch.getStats();
console.log(stats);

// Limpar o cache se necessário
binarySearch.clearCache();
```

## Implementação

A implementação da busca binária recursiva com cache está disponível em dois arquivos:

1. **BinarySearch.js**: Contém a classe principal com a implementação do algoritmo
2. **binarySearchTest.js**: Script de teste para medir e comparar o desempenho
