## Visão Geral da Arquitetura

Este é um aplicativo React de página única (SPA) construído com Vite. O backend é alimentado por funções serverless (provavelmente Cloudflare Workers) localizadas no diretório `functions/`.

O frontend e o backend estão no mesmo monorepo, mas são implantados e executados separadamente.

### Frontend

- **Framework:** React com Vite.
- **Estrutura de Diretórios:**
    - `src/components`: Componentes de UI reutilizáveis.
    - `src/features`: Componentes maiores e mais complexos que representam recursos específicos do aplicativo, como `bancoQuestoes`, `calculadora` e `chat`.
    - `src/pages`: Componentes de nível superior que representam páginas ou visualizações.
    - `src/contexts`: Contextos React para gerenciamento de estado global.
    - `src/hooks`: Hooks React personalizados.
- **Estilo:** CSS simples. Os estilos são modulares e específicos do componente.
- **Fluxo de Dados:** O aplicativo busca dados de funções serverless e de arquivos JSON estáticos no diretório `public/`.

### Backend

- **Plataforma:** Funções serverless (provavelmente Cloudflare Workers, com base em `wrangler.toml.no`).
- **Estrutura de Diretórios:**
    - `functions/api`: Endpoints da API para interagir com o frontend. Cada arquivo corresponde a um endpoint.
- **Lógica de Negócios:** As funções lidam com a lógica de negócios relacionada a perguntas, como criar, filtrar, pesquisar e gerar flashcards.

## Fluxos de Trabalho de Desenvolvimento

### Executando o Frontend

Para iniciar o servidor de desenvolvimento do Vite, execute:

```bash
npm run dev
```

### Executando o Backend

Para executar as funções serverless localmente, você provavelmente usará o Wrangler CLI.

```bash
npx wrangler dev
```

## Convenções e Padrões

- **Nomenclatura de Componentes:** Os componentes são nomeados usando PascalCase (por exemplo, `QuestionBankPage.jsx`).
- **Nomenclatura de Estilos:** Os arquivos CSS são nomeados com o mesmo nome do componente que estilizam (por exemplo, `BottomNavBar.css` para `BottomNavBar.jsx`).
- **Comunicação Frontend-Backend:** O frontend faz chamadas de API para os endpoints definidos em `functions/api/`. Por exemplo, para buscar perguntas, ele provavelmente chama o endpoint `/api/questions`.

## Pontos de Integração e Dependências

- **Cloudflare Workers:** O backend depende da plataforma Cloudflare Workers para implantação e execução.
- **Arquivos de Dados Estáticos:** O aplicativo depende de arquivos JSON estáticos em `public/` para alguns de seus dados.
