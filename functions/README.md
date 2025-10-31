# Cloudflare Functions

API serverless do PAVE React implementada com Cloudflare Pages Functions.

## Estrutura

```
functions/
└── api/
  ├── filters/                  # Endpoints de filtros
  │   ├── filter.js             # POST /api/filter
  │   └── get-filter-options.js # GET /api/get-filter-options
  ├── questions/                # Endpoints de questões
  │   ├── prova.js              # GET /api/prova
  │   └── search-questions.js   # POST /api/search-questions
  └── utils/                    # Utilitários compartilhados
    └── uploader.js           # Fetch de questões do R2
```

## Endpoints Disponíveis

### Filtros
- `POST /api/filter` - Filtra questões por critérios
- `GET /api/get-filter-options` - Lista opções de filtros disponíveis

### Questões
- `GET /api/prova?name={nome}` - Busca prova específica
- `POST /api/search-questions` - Busca textual de questões

## Desenvolvimento Local

### 1. Build do Frontend
```bash
cd ..
npm run build
```

### 2. Rodar Functions Localmente
```bash
wrangler pages dev dist
```

O servidor estará disponível em `http://localhost:8788`

## Padrões de Código

### Estrutura de uma Function

```javascript
export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    // 1. Validar request
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Parse body (se necessário)
    const body = await request.json();
    
    // 3. Lógica de negócio
    const result = await processRequest(body, env);
    
    // 4. Retornar resposta
    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### Boas Práticas

1. **Sempre retorne JSON** com campo `success`
2. **Use try-catch** para capturar erros
3. **Valide inputs** antes de processar
4. **Use env bindings** para acessar recursos (AI, R2, Vectorize)
5. **Documente** funções complexas

## Acessando Dados

### ❌ NUNCA faça isso:
```javascript
// NÃO leia do filesystem
import questoes from '../../public/questoes.json';
```

### ✅ SEMPRE faça isso:
```javascript
// Use a função utilitária
import { fetchAllQuestions } from '../utils/uploader.js';

const questions = await fetchAllQuestions(env);
```

## Environment Variables

As functions acessam variáveis via `env`:

```javascript
export async function onRequest({ env }) {
  const uploaderUrl = env.PAVE_UPLOADER_BASE_URL;
  const user = env.PAVE_UPLOADER_ADMIN_USER;
  const password = env.PAVE_UPLOADER_ADMIN_PASSWORD;
  
  // AI binding
  const embedding = await env.AI.run('@cf/baai/bge-m3', { text });
  
  // Vectorize binding
  const results = await env.QUESTIONS_INDEX.query(embedding);
  
  // R2 binding
  const object = await env.QUESTOES_PAVE_BUCKET.get('key');
}
```

## Bindings Disponíveis

### AI (`env.AI`)
```javascript
// Gerar embedding
const embedding = await env.AI.run('@cf/baai/bge-m3', {
  text: 'sua query aqui'
});

// Usar LLM (se configurado)
const response = await env.AI.run('@cf/meta/llama-2-7b-chat', {
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Vectorize (`env.QUESTIONS_INDEX`)
```javascript
// Buscar vetores similares
const results = await env.QUESTIONS_INDEX.query(embedding, {
  topK: 10,
  returnMetadata: true
});

// Inserir vetores
await env.QUESTIONS_INDEX.insert([{
  id: 'q-123',
  values: embedding,
  metadata: { disciplina: 'Matemática' }
}]);
```

### R2 (`env.QUESTOES_PAVE_BUCKET`)
```javascript
// Ler objeto
const object = await env.QUESTOES_PAVE_BUCKET.get('prova.json');
const data = await object.json();

// Escrever objeto
await env.QUESTOES_PAVE_BUCKET.put('key', JSON.stringify(data));

// Listar objetos
const list = await env.QUESTOES_PAVE_BUCKET.list();
```

## Testing

### Testar Endpoint Local

```bash
# GET request
curl http://localhost:8788/api/get-filter-options

# POST request
curl -X POST http://localhost:8788/api/filter \
  -H "Content-Type: application/json" \
  -d '{"disciplina": "Matemática"}'
```

### Debug

Adicione logs:
```javascript
console.log('Debug info:', { variable });
```

Visualize no terminal do Wrangler:
```bash
wrangler pages dev dist
# Logs aparecem aqui em tempo real
```

## Deploy

As functions são automaticamente deployed com o frontend:

```bash
npm run build
wrangler pages deploy dist
```

As functions em `functions/api/` são mapeadas para `/api/` automaticamente.

## Troubleshooting

### Function não encontrada (404)
- Verifique se o arquivo está em `functions/api/`
- Nome do arquivo = nome da rota (sem `/api/`)
- Ex: `functions/api/filter.js` → `/api/filter`

### Binding undefined
- Confirme bindings no `wrangler.toml`
- Em produção, configure no Cloudflare Dashboard
- Restart do dev server pode ser necessário

### CORS errors
- Cloudflare Pages adiciona CORS headers automaticamente
- Para customizar, retorne headers na Response:
```javascript
return new Response(body, {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
});
```

## Recursos

- [Cloudflare Functions Docs](https://developers.cloudflare.com/pages/functions/)
- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Vectorize Docs](https://developers.cloudflare.com/vectorize/)
- [R2 Docs](https://developers.cloudflare.com/r2/)
