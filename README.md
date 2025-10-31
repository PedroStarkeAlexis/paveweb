# 🎓 PAVE React

> Plataforma interativa de estudos para o vestibular PAVE (Programa de Avaliação da Vida Escolar) com IA integrada, banco de questões e calculadora de médias.

[![Deploy](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple)](https://vitejs.dev/)

## 📋 Visão Geral

PAVE React é uma aplicação full-stack moderna que combina:

- 🤖 **IA Integrada** - Chat inteligente com Gemini para buscar questões e criar conteúdo
- 📚 **Banco de Questões** - Milhares de questões com filtros avançados e busca semântica
- 🧮 **Calculadora PAVE** - Calcule suas médias e chances de aprovação
- 💾 **Salvamento Local** - Organize suas questões favoritas
- 🌓 **Dark Mode** - Interface adaptável com tema claro/escuro

## 🏗️ Arquitetura

```
PAVE-react/
├── functions/       # Cloudflare Functions (API serverless)
│   ├── api/
│   │   ├── filters/     # Endpoints de filtros
│   │   ├── questions/   # Endpoints de questões
│   │   └── utils/       # Utilitários compartilhados
│   └── README.md
├── frontend/         # Aplicação React + Vite
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   │   ├── common/  # Componentes compartilhados (QuestionLayout)
│   │   │   ├── layout/  # Componentes de layout (BottomNavBar, MoreMenu)
│   │   │   └── icons/   # Componentes de ícones SVG
│   │   ├── features/    # Features modulares
│   │   │   ├── questions/   # Banco de questões
│   │   │   ├── calculadora/ # Calculadora PAVE
│   │   │   └── saved/       # Questões salvas
│   │   ├── contexts/    # Estado global
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Páginas principais
│   │   ├── styles/      # Estilos globais
│   │   └── utils/       # Utilitários
│   ├── public/
│   └── README.md
├── config/           # Configurações (ESLint, Vite, Wrangler)
├── docs/             # Documentação detalhada
│   ├── ARCHITECTURE.md  # Arquitetura e fluxos
│   ├── API.md          # Documentação da API
│   └── DEPLOYMENT.md   # Guia de deploy
└── README.md         # Este arquivo
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Cloudflare (para deploy)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/PAVE-react.git
cd PAVE-react

# Instale dependências
npm install

# Configure ambiente local
cp wrangler.toml.no wrangler.toml
# Edite wrangler.toml com suas credenciais
```

### Desenvolvimento

```bash
# Frontend (Vite dev server)
npm run dev
# Acesse: http://localhost:5173

# Serverless API (Cloudflare Functions)
npm run build
wrangler pages dev dist
# Acesse: http://localhost:8788
```

### Build para Produção

```bash
npm run build
```

## 📚 Documentação

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitetura detalhada, fluxos de dados e padrões
- **[API.md](docs/API.md)** - Documentação completa da API
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Guia de deploy e configuração
- **[Functions README](functions/README.md)** - Específico das funções serverless
- **[Frontend README](frontend/README.md)** - Específico do frontend

## 🎯 Features Principais

### 🤖 Chat com IA

Sistema de chat inteligente com **análise em 2 etapas**:

1. **Análise de Intenção** - Detecta o que o usuário quer (buscar, criar, conversar)
2. **Execução** - Busca vetorial híbrida ou geração de conteúdo

**Tecnologias:**
- Google Gemini (LLM principal)
- Cloudflare AI (embeddings BGE-M3)
- Cloudflare Vectorize (busca vetorial)

### 📖 Banco de Questões

- Filtros por curso, disciplina, ano e etapa
- Busca textual e semântica
- Visualização padronizada com LaTeX/Markdown
- Sistema de salvamento local

### 🧮 Calculadora PAVE

- Wizard interativo multi-etapas
- Cálculo de médias ponderadas
- Visualizações gráficas de desempenho
- Compartilhamento de resultados

### 💾 Gestão de Questões

- Salvamento em localStorage
- Sincronização entre abas
- Organização por disciplina
- Export/import (futuro)

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - UI framework
- **Vite 6** - Build tool ultra-rápido
- **React Router 7** - Roteamento SPA
- **Motion** - Animações fluidas
- **React Markdown** - Renderização de conteúdo

### Functions
- **Cloudflare Pages Functions** - API serverless
- **Cloudflare AI** - Embeddings e LLMs
- **Cloudflare Vectorize** - Busca vetorial
- **Cloudflare R2** - Object storage

### IA/ML
- **Google Gemini** - LLM para análise e geração
- **BGE-M3** - Embeddings multilíngue
- **RAG** - Retrieval-Augmented Generation

## 🔧 Scripts Disponíveis

```bash
npm run dev       # Inicia dev server (Vite)
npm run build     # Build para produção
npm run preview   # Preview do build
npm run lint      # Lint com ESLint
```

## 🌐 Deploy

### Deploy Automático (GitHub)

1. Conecte o repositório ao Cloudflare Pages
2. Configure variáveis de ambiente no dashboard
3. Push para `main` → deploy automático

### Deploy Manual (Wrangler)

```bash
npm run build
wrangler pages deploy dist
```

Ver **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** para instruções completas.

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# .env.development (local)
PAVE_UPLOADER_BASE_URL=https://pave-uploader.workers.dev
PAVE_UPLOADER_ADMIN_USER=admin
PAVE_UPLOADER_ADMIN_PASSWORD=***
```

### Bindings Cloudflare

Configure no `wrangler.toml` ou via dashboard:

- **AI Binding** (`env.AI`) - Para embeddings e LLMs
- **Vectorize** (`env.QUESTIONS_INDEX`) - Índice de busca vetorial
- **R2 Bucket** (`env.QUESTOES_PAVE_BUCKET`) - Storage de questões

## 📖 Guias de Uso

### Para Desenvolvedores

1. Leia **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** para entender os fluxos
2. Consulte **[API.md](docs/API.md)** para integração com as funções
3. Veja **[Functions README](functions/README.md)** e **[Frontend README](frontend/README.md)** para detalhes específicos

### Para DevOps

1. Siga **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** para configuração de infraestrutura
2. Configure CI/CD conforme necessário
3. Monitore via Cloudflare Analytics

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Minha feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Convenções

- **Commits:** Use padrão conventional commits
- **Código:** Siga ESLint configurado
- **Componentes:** Functional components com hooks
- **Estilos:** Use variáveis CSS do design system

## 📝 Estrutura de Questões

Todas as questões seguem este schema:

```typescript
interface Questao {
  id: string;              // "2024-e1-q15"
  numero: number;          // 15
  corpo_questao: string;   // Markdown/LaTeX suportado
  alternativas: string[];  // 5 alternativas
  gabarito: string;        // "A", "B", "C", "D" ou "E"
  disciplina: string;      // "Matemática", "Português", etc.
  curso: string;           // "Medicina", "Direito", etc.
  ano: number;             // 2024
  etapa: number;           // 1, 2 ou 3
}
```

## 🔒 Segurança

- Basic Auth para acesso ao R2
- Secrets gerenciados via Cloudflare
- Validação de entrada em todos os endpoints
- CORS configurado automaticamente

## 📊 Performance

- Build otimizado com Vite
- Code splitting automático
- Lazy loading de features
- Cache de embeddings
- CDN global via Cloudflare

## 🐛 Troubleshooting

### Build falha
```bash
rm -rf node_modules dist .wrangler
npm install
npm run build
```

### Functions não funcionam
- Verifique bindings no Cloudflare Dashboard
- Confirme variáveis de ambiente
- Verifique logs: `wrangler pages deployment tail`

### Questões não aparecem
- Verifique se o Worker uploader está acessível
- Confirme credenciais Basic Auth
- Teste endpoint `/api/prova?name=pave-2024-e1`

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/seu-usuario/PAVE-react/issues)
- **Documentação:** `/docs` neste repositório
- **Cloudflare Community:** [Community Forum](https://community.cloudflare.com/)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- Cloudflare pela infraestrutura serverless
- Google Gemini pela IA
- Comunidade React e Vite
- Todos os contribuidores

---

**Desenvolvido para estudantes PAVE** 🎓📚

*Última atualização: Outubro 2025*
