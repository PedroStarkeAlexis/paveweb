# Documentação da API

## Visão Geral

Todas as rotas da API estão sob o prefixo `/api/` e são implementadas como Cloudflare Pages Functions.

## Endpoints

### 🔍 Busca e IA

#### `POST /api/ask`
Chat com IA para buscar questões, criar conteúdo ou conversar.

**Request:**
```json
{
  "message": "Me mostre questões de cálculo sobre limites",
  "conversationHistory": []  // Opcional
}
```

**Response (Busca):**
```json
{
  "success": true,
  "intent": "BUSCAR_QUESTAO",
  "questions": [
    {
      "id": "2024-e1-q15",
      "disciplina": "Matemática",
      "curso": "Medicina",
      "corpo_questao": "...",
      "alternativas": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "gabarito": "C",
      "ano": 2024,
      "etapa": 1
    }
  ],
  "explanation": "Encontrei 3 questões sobre limites..."
}
```

**Response (Criação):**
```json
{
  "success": true,
  "intent": "CRIAR_QUESTAO",
  "content": {
    "questao": "...",
    "alternativas": ["..."],
    "gabarito": "A",
    "explicacao": "..."
  }
}
```

**Intents Suportados:**
- `BUSCAR_QUESTAO`: Busca híbrida (vetorial + IA)
- `CRIAR_QUESTAO`: Gera questão personalizada
- `CRIAR_FLASHCARDS`: Gera flashcards de estudo
- `CONVERSAR`: Resposta conversacional
- `INFO_PAVE`: Informações sobre o vestibular

#### `POST /api/search-questions`
Busca textual simples de questões.

**Request:**
```json
{
  "query": "fotossíntese",
  "filters": {
    "disciplina": "Biologia",
    "ano": 2024
  }
}
```

**Response:**
```json
{
  "success": true,
  "questions": [...],
  "total": 12
}
```

### 📋 Filtros e Opções

#### `GET /api/get-filter-options`
Retorna todas as opções disponíveis para filtros.

**Response:**
```json
{
  "success": true,
  "options": {
    "cursos": ["Medicina", "Direito", "Engenharia", ...],
    "disciplinas": ["Matemática", "Português", "Biologia", ...],
    "anos": [2024, 2023, 2022, ...],
    "etapas": [1, 2, 3]
  }
}
```

#### `POST /api/filter`
Filtra questões por critérios específicos.

**Request:**
```json
{
  "curso": "Medicina",
  "disciplina": "Biologia",
  "ano": 2024,
  "etapa": 1
}
```

**Response:**
```json
{
  "success": true,
  "questions": [...],
  "count": 25,
  "filters_applied": {
    "curso": "Medicina",
    "disciplina": "Biologia",
    "ano": 2024,
    "etapa": 1
  }
}
```

### 📄 Dados Brutos

#### `GET /api/prova?name={nome}`
Retorna dados de uma prova específica via proxy do R2.

**Parâmetros:**
- `name`: Nome da prova (ex: `pave-2024-e1`)

**Response:**
```json
{
  "ano": 2024,
  "etapa": 1,
  "questoes": [
    {
      "id": "2024-e1-q1",
      "numero": 1,
      "corpo_questao": "...",
      "alternativas": ["..."],
      "gabarito": "A",
      "disciplina": "Matemática",
      "curso": "Medicina"
    }
  ]
}
```

## Estrutura de Questão

Todas as questões seguem este schema:

```typescript
interface Questao {
  id: string;              // Identificador único (ano-etapa-numero)
  numero: number;          // Número da questão na prova
  corpo_questao: string;   // Enunciado (pode conter Markdown/LaTeX)
  alternativas: string[];  // Array de 5 alternativas
  gabarito: string;        // Letra da resposta correta (A-E)
  disciplina: string;      // Ex: "Matemática", "Biologia"
  curso: string;           // Ex: "Medicina", "Direito"
  ano: number;             // Ex: 2024
  etapa: number;           // 1, 2 ou 3
  dificuldade?: string;    // "fácil", "média", "difícil" (opcional)
  tags?: string[];         // Tags adicionais (opcional)
}
```

## Autenticação

Atualmente, a API é pública. Autenticação está planejada para:
- Rate limiting
- Estatísticas de uso
- Features premium

## Variáveis de Ambiente

Necessárias no Cloudflare Pages:

```bash
# Worker Uploader (R2 Access)
PAVE_UPLOADER_BASE_URL=https://pave-uploader.workers.dev
PAVE_UPLOADER_ADMIN_USER=admin
PAVE_UPLOADER_ADMIN_PASSWORD=***

# Cloudflare AI (configurado via wrangler.toml)
# - AI binding: env.AI
# - Vectorize binding: env.QUESTIONS_INDEX
# - R2 binding: env.QUESTOES_PAVE_BUCKET
```

## Rate Limits

Atualmente sem limite. Recomendado implementar:
- 100 requests/minuto por IP
- 1000 requests/dia por IP
- Throttling em busca vetorial

## Códigos de Status

- `200`: Sucesso
- `400`: Requisição inválida (parâmetros faltando/incorretos)
- `401`: Não autenticado (para endpoints futuros)
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor
- `503`: Serviço temporariamente indisponível

## Exemplos de Uso

### JavaScript/Fetch
```javascript
// Busca com IA
const response = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Questões sobre fotossíntese'
  })
});
const data = await response.json();
```

### cURL
```bash
# Buscar questões
curl -X POST https://pave.app/api/ask \
  -H "Content-Type: application/json" \
  -d '{"message": "Questões de matemática"}'

# Obter filtros
curl https://pave.app/api/get-filter-options
```

## Notas de Implementação

1. **Todas as Functions** devem retornar JSON
2. **Sempre** inclua o campo `success: true/false`
3. **Erros** devem incluir campo `error` com mensagem descritiva
4. **Dados de questões** vêm do Worker remoto via `fetchAllQuestions()`
5. **Prompts de IA** estão em `functions/api/prompt.js`
