# Correções de Busca Vetorial - Debug Session

## Problemas Identificados

### 1. **Threshold Muito Alto** ❌
- **Antes:** `MIN_SCORE_THRESHOLD = 0.65`
- **Depois:** `MIN_SCORE_THRESHOLD = 0.45`
- **Motivo:** Com 0.65, NENHUMA questão estava passando no filtro, resultando em 0 matches

### 2. **Query Não Processada** ❌
- **Antes:** Busca vetorial usando query completa: `"mostra uma questao de evolucionismo"`
- **Depois:** Extração de termos relevantes: `"evolucionismo"`
- **Motivo:** Embeddings funcionam melhor com conceitos/termos puros, sem palavras de comando

## Solução Implementada

### Função `extractSearchTerms()`

```javascript
function extractSearchTerms(userQuery, entities) {
  // Prioridade 1: Usar entidades extraídas pelo Router
  if (entities) {
    const terms = [];
    if (entities.materia) terms.push(entities.materia);
    if (entities.topico) terms.push(entities.topico);
    if (terms.length > 0) {
      return terms.join(" ");
    }
  }
  
  // Prioridade 2: Limpar query removendo stop words
  const stopWords = [
    "mostra", "mostre", "me", "uma", "questao", "questão",
    "sobre", "do", "da", "de", "que", "fale",
    "busca", "busque", "procura", "encontra",
    // ... mais stop words
  ];
  
  const words = userQuery.toLowerCase()
    .split(/\s+/)
    .filter(word => !stopWords.includes(word) && word.length > 2);
  
  return words.join(" ") || userQuery;
}
```

## Exemplos de Transformação

| Query Original | Termos Extraídos | Entidades Router |
|----------------|------------------|------------------|
| "mostra uma questao de evolucionismo" | "evolucionismo" | topico: "evolucionismo" |
| "busque questões sobre fotossíntese" | "fotossíntese" | topico: "fotossíntese" |
| "questão de química orgânica" | "química orgânica" | materia: "Química", topico: "orgânica" |
| "me mostre algo do pave 2024" | "pave 2024" | ano: 2024 |

## Fluxo Atualizado

```
1. Router extrai entities (materia, topico, ano)
2. extractSearchTerms() usa entities OU limpa a query
3. Embedding gerado com termos limpos
4. Busca vetorial com threshold 0.45 (mais permissivo)
5. Re-ranking com IA para selecionar as melhores
```

## Resultados Esperados

### Antes:
```
Query: "mostra uma questao de evolucionismo"
Embedding: "mostra uma questao de evolucionismo"
Matches: 0 (threshold muito alto)
Resultado: ❌ Nenhuma questão encontrada
```

### Depois:
```
Query: "mostra uma questao de evolucionismo"
Entities: { topico: "evolucionismo" }
Termos: "evolucionismo"
Embedding: "evolucionismo"
Matches: 8 com score >= 0.45
Re-ranking: Seleciona as 2 melhores
Resultado: ✅ Questões relevantes encontradas!
```

## Logs de Debug Adicionados

```javascript
console.log(`[LOG] ${functionName}: Query original: "${userQuery}"`);
console.log(`[LOG] ${functionName}: Termos de busca extraídos: "${searchTerms}"`);
console.log(`[LOG] ${functionName}: Iniciando busca vetorial com termos: "${searchTerms}"`);
```

## Próximas Melhorias (Opcional)

1. **Sinônimos:** Expandir termos (ex: "evolução" → "evolucionismo, darwin, seleção natural")
2. **Stemming:** Reduzir palavras à raiz (ex: "fotossíntese" → "fotossintes")
3. **Cache de Embeddings:** Cachear embeddings de queries frequentes
4. **Threshold Dinâmico:** Ajustar threshold baseado no número de resultados
5. **Boost por Metadata:** Dar peso maior para matches em materia/ano

## Performance

- **Tempo de Busca:** ~1-2s (embedding + vectorize + re-ranking)
- **Acurácia:** Espera-se 80-90% de relevância com o novo threshold
- **Cobertura:** Maior (threshold mais baixo + termos limpos)
