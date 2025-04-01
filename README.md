# Comparação de Algoritmos de Ordenação

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

## Estrutura do Projeto

- `src/generator.js`: Gerador de dados aleatórios
- `src/strategies/`: Implementações dos algoritmos de ordenação
- `src/SortContext.js`: Contexto para o padrão Strategy
- `src/tracing.js`: Integração com OpenTelemetry e Jaeger para telemetria
- `src/index.js`: Script principal para comparação dos algoritmos

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

| Algoritmo      | Melhor Caso | Caso Médio | Pior Caso  | Estabilidade |
| -------------- | ----------- | ---------- | ---------- | ------------ |
| Bubble Sort    | O(n)        | O(n²)      | O(n²)      | Estável      |
| Insertion Sort | O(n)        | O(n²)      | O(n²)      | Estável      |
| Selection Sort | O(n²)       | O(n²)      | O(n²)      | Instável     |
| Quick Sort     | O(n log n)  | O(n log n) | O(n²)      | Instável     |
| Merge Sort     | O(n log n)  | O(n log n) | O(n log n) | Estável      |
| Heap Sort      | O(n log n)  | O(n log n) | O(n log n) | Instável     |
| Tim Sort       | O(n)        | O(n log n) | O(n log n) | Estável      |
| Shell Sort     | O(n log n)  | O(n log²n) | O(n²)      | Instável     |
| Counting Sort  | O(n+k)      | O(n+k)     | O(n+k)     | Estável      |
| Radix Sort     | O(nk)       | O(nk)      | O(nk)      | Estável      |

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
