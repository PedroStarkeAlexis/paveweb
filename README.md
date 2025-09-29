# PAVE React

Front-end da plataforma PAVE construído com React + Vite e integrado às funções do Cloudflare Pages/Workers.

## Desenvolvimento local

```bash
npm install
npm run dev
```

As funções (`functions/api`) podem ser executadas com `wrangler pages dev` usando as variáveis configuradas em `wrangler.toml.no`.

## Integração com o bucket R2

As provas passaram a ser servidas pelo Worker `pave-uploader` que protege os JSONs com Basic Auth. O front consome essas informações através da rota `/api/prova`, que atua como proxy seguro.

### Variáveis de ambiente necessárias

Configure no Cloudflare Pages (Preview/Production) e também no desenvolvimento local (`wrangler.toml`):

| Variável                         | Descrição                                                                                              |
|---------------------------------|----------------------------------------------------------------------------------------------------------|
| `PAVE_UPLOADER_BASE_URL`        | URL base do Worker responsável por expor as provas (`https://pave-uploader...workers.dev`).             |
| `PAVE_UPLOADER_ADMIN_USER`      | Usuário do Basic Auth. Por padrão usamos `admin`.                                                         |
| `PAVE_UPLOADER_ADMIN_PASSWORD`  | Senha do Basic Auth. **Defina como segredo** no dashboard (`wrangler secret put`).                       |

> Em desenvolvimento local você pode manter a combinação padrão (`admin` / `admin123`) para testar rapidamente.

### Consumindo as provas no front-end

O componente `AllQuestionsPage` agora busca os dados com:

```jsx
await fetch('/api/prova?name=pave-2024-e3');
```

O json retornado segue a estrutura documentada no repositório do uploader (`corpo_questao`, `alternativas`, `gabarito`, etc.) e é renderizado por `QuestionLayout`.

## Testes, lint e build

```bash
npm run lint
npm run build
```

> O repositório ainda contém avisos/erros de lint herdados em arquivos não alterados. Corrija-os conforme necessário antes de subir para produção.
