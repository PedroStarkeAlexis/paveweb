# Refatoração: Centralização do Estado com useReducer

## 📋 Sumário da Tarefa
**Tarefa 1.1**: Centralizar o Gerenciamento de Estado do Wizard (KISS, Single Responsibility)

## ✅ O que foi feito

### 1. Substituição de useState por useReducer
Anteriormente, o hook `useCalculadoraWizard` gerenciava o estado através de **9 chamadas useState separadas**:
- `wizardStep`
- `selectedEtapas`
- `etapasFlow`
- `desempenho`
- `selecaoCurso`
- `resultados`
- `validationErrors`
- `cursosDisponiveis`
- `loadingCursos`
- `errorCursos`

Agora, todo o estado está centralizado em **um único `useReducer`**.

### 2. Estrutura do Estado Inicial (`initialState`)
```javascript
const initialState = {
    wizardStep: WIZARD_STEPS.SELECAO_ETAPAS,
    selectedEtapas: [],
    etapasFlow: [],
    desempenho: { ... },
    selecaoCurso: { cursoId: '' },
    resultados: { ... },
    validationErrors: {},
    cursosDisponiveis: [],
    loadingCursos: true,
    errorCursos: null,
};
```

### 3. Tipos de Ação (`ACTION_TYPES`)
Foram definidos **12 tipos de ação** para gerenciar todas as operações de estado:

| Tipo de Ação | Responsabilidade |
|--------------|------------------|
| `SET_WIZARD_STEP` | Define a etapa atual do wizard |
| `SET_SELECTED_ETAPAS` | Atualiza etapas selecionadas e fluxo dinâmico |
| `UPDATE_DESEMPENHO` | Atualiza dados de desempenho (acertos, ignoradas, redação) |
| `UPDATE_SELECAO_CURSO` | Atualiza curso selecionado |
| `UPDATE_RESULTADOS` | Atualiza resultados calculados |
| `SET_VALIDATION_ERROR` | Adiciona erro de validação |
| `CLEAR_VALIDATION_ERROR` | Remove erro de validação |
| `SET_CURSOS_DISPONIVEIS` | Define lista de cursos disponíveis |
| `SET_LOADING_CURSOS` | Atualiza estado de carregamento |
| `SET_ERROR_CURSOS` | Define erro ao carregar cursos |
| `AVANCAR_ETAPA` | Avança para próxima etapa (com cálculo opcional de resultados) |
| `VOLTAR_ETAPA` | Volta para etapa anterior |
| `ATUALIZAR_NOTAS_ETAPAS` | Atualiza notas calculadas das etapas |

### 4. Função Reducer (`wizardReducer`)
A função reducer centraliza toda a lógica de atualização de estado em um único lugar:
```javascript
const wizardReducer = (state, action) => {
    switch (action.type) {
        case ACTION_TYPES.SET_WIZARD_STEP:
            return { ...state, wizardStep: action.payload };
        
        case ACTION_TYPES.UPDATE_DESEMPENHO:
            return {
                ...state,
                desempenho: { ...state.desempenho, ...action.payload },
            };
        
        // ... outros cases
        
        default:
            return state;
    }
};
```

### 5. Migração de Chamadas de Estado

#### Antes (useState):
```javascript
setWizardStep(WIZARD_STEPS.ETAPA_1);
setDesempenho(prev => ({ ...prev, notaRedacao: value }));
setValidationErrors(prev => ({ ...prev, [errorKey]: message }));
setCursosDisponiveis(data);
```

#### Depois (useReducer + dispatch):
```javascript
dispatch({ type: ACTION_TYPES.SET_WIZARD_STEP, payload: WIZARD_STEPS.ETAPA_1 });
dispatch({ type: ACTION_TYPES.UPDATE_DESEMPENHO, payload: { notaRedacao: value } });
dispatch({ type: ACTION_TYPES.SET_VALIDATION_ERROR, payload: { key: errorKey, message } });
dispatch({ type: ACTION_TYPES.SET_CURSOS_DISPONIVEIS, payload: data });
```

### 6. Funções Atualizadas

Todas as funções que alteravam o estado foram refatoradas para usar `dispatch`:

- ✅ `validateEtapaPAVE` - Agora usa `SET_VALIDATION_ERROR` e `CLEAR_VALIDATION_ERROR`
- ✅ `handleDesempenhoChange` - Usa `UPDATE_DESEMPENHO`
- ✅ `handleRedacaoChange` - Usa `UPDATE_DESEMPENHO`
- ✅ `handleCursoChange` - Usa `UPDATE_SELECAO_CURSO`
- ✅ `handleEtapasSelectionChange` - Usa `SET_SELECTED_ETAPAS`
- ✅ `handleProximaEtapa` - Usa `AVANCAR_ETAPA`
- ✅ `handleEtapaAnterior` - Usa `VOLTAR_ETAPA`
- ✅ `calcularResultadosFinais` - Agora retorna os resultados ao invés de chamar `setResultados`
- ✅ `fetchCursos` (useEffect) - Usa `SET_LOADING_CURSOS`, `SET_ERROR_CURSOS`, `SET_CURSOS_DISPONIVEIS`

### 7. Melhorias na Lógica de Navegação

A ação `AVANCAR_ETAPA` foi otimizada para suportar cálculo de resultados finais inline:
```javascript
case ACTION_TYPES.AVANCAR_ETAPA: {
    const { nextStep, resultadosFinais } = action.payload;
    const updates = { wizardStep: nextStep };
    if (resultadosFinais) {
        updates.resultados = { ...state.resultados, ...resultadosFinais };
    }
    return { ...state, ...updates };
}
```

## 🎯 Benefícios Alcançados

### 1. **KISS (Keep It Simple, Stupid)**
- ✅ Toda a lógica de atualização de estado está em **um único lugar** (reducer)
- ✅ Mais fácil de entender o fluxo de dados
- ✅ Menos código duplicado (não precisa de múltiplos `setState`)

### 2. **Single Responsibility Principle (SOLID)**
- ✅ **Reducer**: Responsabilidade única de gerenciar o estado
- ✅ **Hook**: Se concentra em orquestrar a lógica e efeitos colaterais
- ✅ **Handlers**: Focam apenas em validação e preparação de dados

### 3. **Manutenibilidade**
- ✅ Facilita adicionar novos tipos de ação no futuro
- ✅ Cada ação é auto-documentada através dos `ACTION_TYPES`
- ✅ Mais fácil de debugar (pode adicionar logging no reducer)

### 4. **Previsibilidade**
- ✅ Estado é imutável - sempre retorna novo objeto
- ✅ Transições de estado são explícitas e rastreáveis
- ✅ Testabilidade melhorada (reducer é função pura)

## 📊 Comparação de Linhas de Código

| Métrica | Antes | Depois |
|---------|-------|--------|
| Chamadas `useState` | 10 | 0 |
| Chamadas `useReducer` | 0 | 1 |
| Definições de tipos de ação | 0 | 12 |
| Função reducer | 0 | 1 (~60 linhas) |
| Total de linhas | 341 | 472 |

**Nota**: O aumento de linhas se deve à estruturação explícita (tipos de ação, estado inicial e reducer), mas o código resultante é **mais organizado, manutenível e escalável**.

## 🧪 Testes Recomendados

Para validar a refatoração, teste os seguintes fluxos:

1. ✅ Seleção de etapas
2. ✅ Navegação entre etapas (avançar/voltar)
3. ✅ Entrada de dados de desempenho
4. ✅ Validação de erros (soma > 80)
5. ✅ Inclusão/exclusão de redação
6. ✅ Seleção de curso
7. ✅ Cálculo de resultados finais
8. ✅ Carregamento de cursos do R2

## 🔄 Próximos Passos Sugeridos

1. Adicionar testes unitários para o reducer
2. Implementar logging de ações em desenvolvimento
3. Considerar memoização de valores derivados do estado
4. Avaliar extração do reducer para arquivo separado se crescer muito

## 📝 Observações

- A interface pública do hook permanece **100% compatível** com a versão anterior
- Nenhuma mudança é necessária nos componentes que usam o hook
- O comportamento funcional é idêntico, apenas a implementação interna mudou
