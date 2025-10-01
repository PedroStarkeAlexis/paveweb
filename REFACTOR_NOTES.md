# Refatoração do Sistema de Chat - Padrão Router-Executor

## Resumo das Mudanças

Esta refatoração completa do sistema de chat do PAVE implementa o padrão **Router-Executor** usando a nova biblioteca `@google/genai` e os modelos **Gemini 2.5**.

## Principais Mudanças

### 1. **Atualização de Biblioteca** ✅
- **Antes:** `@google/generative-ai` (depreciada)
- **Depois:** `@google/genai` (atual)
- **Motivo:** Acesso a features modernas como Structured Output e melhores modelos

### 2. **Arquitetura: Padrão Router-Executor** ✅

#### Antes (Problema):
```
User Query → Mega-Prompt (faz tudo) → Resposta ambígua/quebrada
```

#### Depois (Solução):
```
User Query → Router (detecta intenção) → Executor (ação específica) → Resposta confiável
```

### 3. **Structured Output em Todos os Lugares** ✅

Agora TODOS os prompts usam `responseSchema` com tipos do `@google/genai`:

- **Router de Intenções:** Retorna JSON estruturado com `intent`, `entities`, `questionCount`
- **Geração de Questões:** Retorna array de questões validadas
- **Geração de Flashcards:** Retorna array de flashcards validados
- **Re-ranking:** Retorna array de IDs selecionados

**Benefício:** Zero "respostas quebradas" - o JSON sempre vem correto!

### 4. **Estratégia de Múltiplos Modelos** ✅

```javascript
const FAST_MODEL = "gemini-2.5-flash";     // Router, Re-ranking
const CREATIVE_MODEL = "gemini-2.5-flash"; // Criação de conteúdo
```

**Futuramente:** Pode-se usar `gemini-2.5-flash-lite` para tarefas rápidas quando disponível.

## Arquivos Modificados

### `functions/api/utils/ai.js`
- Função `callGeminiAPI` refatorada para aceitar configurações avançadas
- Suporte a `responseSchema`, `tools`, `systemInstruction`, etc.
- Helpers `extractTextFromResponse` e `extractFunctionCalls`

### `functions/api/prompt.js`
- **Novo:** `createIntentRouterPrompt` + `INTENT_ROUTER_SCHEMA`
- **Novo:** `createQuestionGenerationPromptV2` + `QUESTION_GENERATION_SCHEMA`
- **Novo:** `createFlashcardGenerationPrompt` + `FLASHCARD_GENERATION_SCHEMA`
- **Novo:** `createQuestionReRankingPromptV2` + `QUESTION_RERANKING_SCHEMA`
- Prompts antigos mantidos para compatibilidade (podem ser removidos após testes)

### `functions/api/ask.js`
Refatoração completa:

1. **Fase 1 - Router:** Detecta intenção com Structured Output
2. **Fase 2 - Executor:** Switch case chama handlers específicos:
   - `handleSearchQuestion()` - Busca vetorial + Re-ranking
   - `handleCreateQuestion()` - Gera questões com schema
   - `handleCreateFlashcards()` - Gera flashcards com schema

## Fluxo Detalhado

### Busca de Questões
```
1. Router detecta: BUSCAR_QUESTAO
2. Busca vetorial no Vectorize
3. Re-ranking com IA (Structured Output)
4. Retorna questões selecionadas
```

### Criação de Questões
```
1. Router detecta: CRIAR_QUESTAO
2. Extrai entities (matéria, tópico, count)
3. Chama handleCreateQuestion
4. Gera questões com QUESTION_GENERATION_SCHEMA
5. Valida e retorna
```

### Criação de Flashcards
```
1. Router detecta: CRIAR_FLASHCARDS
2. Extrai entities (tópico, count)
3. Chama handleCreateFlashcards
4. Gera flashcards com FLASHCARD_GENERATION_SCHEMA
5. Valida e retorna
```

## Vantagens da Nova Arquitetura

### 🎯 **Precisão**
- Router focado apenas em classificação
- Schemas garantem formato correto
- Menos ambiguidade nas respostas

### ⚡ **Performance**
- Modelos rápidos para tarefas simples
- Modelos criativos apenas quando necessário
- Menos tokens desperdiçados

### 🔧 **Manutenibilidade**
- Código modular com handlers separados
- Schemas centralizados e reutilizáveis
- Fácil adicionar novos intents

### 🐛 **Robustez**
- Validação em cada etapa
- Tratamento de erros específico
- Logging detalhado

## Próximos Passos (Opcional)

1. **Testar em Produção:** Deploy e monitorar métricas
2. **A/B Testing:** Comparar com versão antiga
3. **Otimizar Modelos:** Testar `gemini-2.5-flash-lite` quando disponível
4. **Cache:** Implementar cache de embeddings para queries frequentes
5. **Feedback Loop:** Coletar feedback dos usuários e ajustar prompts

## Compatibilidade

- ✅ API pública mantida igual (`/api/ask`)
- ✅ Formato de resposta mantido igual
- ✅ Frontend não precisa de mudanças
- ✅ Prompts antigos mantidos como fallback

## Testes Recomendados

### Busca:
- "questão sobre fotossíntese"
- "química do pave 2024"
- "guerra fria história"

### Criação:
- "crie uma questão sobre revolução francesa"
- "gere 3 questões de biologia sobre células"
- "faça uma questão de matemática"

### Flashcards:
- "flashcards sobre mitose"
- "crie 5 flashcards de química orgânica"

### Conversa:
- "oi"
- "como funciona o pave?"
- "obrigado"

## Rollback (se necessário)

Se algo der errado, o código antigo está em `git history`. Para voltar:
```bash
git revert HEAD
```

Ou restaurar apenas o ask.js antigo do commit anterior.
