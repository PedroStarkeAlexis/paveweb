# copilot-instructions.md

```markdown
<!-- copilot-instructions.md -->

# Copilot Instructions - Central PAVE

Este arquivo contém instruções específicas para o GitHub Copilot ao trabalhar neste projeto. Seguir estas diretrizes ajuda a manter a consistência do código e acelera o desenvolvimento.

## 📋 Visão Geral do Projeto

Central PAVE é uma aplicação React + Cloudflare Pages para auxiliar estudantes do PAVE (UFPel) com:
- Banco de questões de provas anteriores
- Calculadora de nota PAVE
- Sistema de questões salvas
- Interface moderna e responsiva

**Stack Principal:**
- **Frontend:** React 19, React Router, Vite
- **Styling:** CSS Modules com variáveis CSS customizadas
- **Animações:** Framer Motion (motion/react)
- **Markdown:** react-markdown, rehype-katex, remark-gfm
- **Backend:** Cloudflare Pages Functions (estrutura futura)

## 🎯 Convenções de Código

### Estrutura de Arquivos

```
frontend/src/
├── components/         # Componentes reutilizáveis
│   ├── common/        # Componentes compartilhados (QuestionLayout, etc)
│   ├── icons/         # Componentes de ícones SVG
│   └── layout/        # Componentes de layout (BottomNavBar, MoreMenu)
├── features/          # Funcionalidades por domínio
│   ├── calculadora/   # Feature da calculadora
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── utils/
│   ├── questions/     # Feature do banco de questões
│   └── saved/         # Feature de questões salvas
├── contexts/          # React Contexts
├── hooks/             # Hooks customizados globais
├── pages/             # Componentes de página
├── styles/            # Estilos globais
└── utils/             # Utilitários globais
```

### Nomenclatura

**Arquivos:**
- Componentes: `PascalCase.jsx` (ex: `QuestionLayout.jsx`)
- Estilos: `PascalCase.css` ou nome-do-componente.css (ex: `QuestionLayout.css`)
- Hooks: `useCamelCase.js` (ex: `useWindowSize.js`)
- Utilitários: `camelCase.js` (ex: `vibration.js`)
- Constantes: `camelCase.js` ou `SCREAMING_SNAKE_CASE.js`

**Componentes e Funções:**
- Componentes React: `PascalCase`
- Funções/Hooks: `camelCase`
- Constantes: `SCREAMING_SNAKE_CASE`
- Variáveis: `camelCase`

### Imports

**Ordem preferencial:**
1. Bibliotecas externas (React, react-router-dom, etc)
2. Componentes de outros features/pastas
3. Componentes locais do mesmo feature
4. Hooks customizados
5. Utilitários e constantes
6. Estilos CSS

**Exemplo:**
```javascript
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'motion/react';

import QuestionLayout from '../../../components/common/QuestionLayout';
import useQuestionSearch from '../hooks/useQuestionSearch';
import { TOTAL_QUESTOES } from '../constants';

import './QuestionListPage.css';
```

## 🎨 Padrões de Estilo

### CSS Customizado

**Use variáveis CSS para cores e temas:**
```css
/* ✅ BOM */
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

/* ❌ EVITE */
.my-component {
  background-color: #ffffff;
  color: #1f2937;
}
```

**Principais variáveis disponíveis:**
```css
/* Backgrounds */
--bg-primary, --bg-secondary, --bg-tertiary

/* Textos */
--text-primary, --text-secondary, --text-muted

/* Bordas */
--border-primary, --border-secondary

/* Marca */
--brand-primary, --brand-primary-hover
--brand-secondary, --brand-secondary-text

/* Estados */
--error-primary, --error-secondary
--success-primary, --success-secondary
```

### Dark Mode

**Sempre implemente suporte a dark mode:**
```css
/* Light mode (padrão) */
.my-component {
  background-color: var(--bg-primary);
}

/* Dark mode */
[data-theme="dark"] .my-component {
  background-color: var(--bg-tertiary);
}
```

### Prefixos de Classe

**Use prefixos específicos para evitar conflitos:**
- Calculadora: `calc-`
- Hub de questões: `hub-`
- Componentes comuns: sem prefixo específico

**Exemplo:**
```css
/* Calculadora */
.calc-wizard-container { }
.calc-tela-titulo { }

/* Hub de Questões */
.hub-carousel-section { }
.hub-section-title { }

/* Componentes Comuns */
.question-layout { }
.alternative-item { }
```

## 🔧 Padrões de Componentes React

### Estrutura de Componente

```javascript
// QuestionListPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import QuestionList from './QuestionList';
import './QuestionListPage.css';

/**
 * Página que exibe lista de questões filtradas por matéria ou ano
 * @param {Object} props - Propriedades do componente
 */
function QuestionListPage() {
  const { subject, year } = useParams();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lógica do componente...

  return (
    <div className="question-list-page">
      {/* JSX do componente */}
    </div>
  );
}

export default QuestionListPage;
```

### Hooks Customizados

```javascript
// useQuestionSearch.js

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook customizado para busca de questões com filtros e debounce
 * 
 * @param {Object} filters - Objeto com os filtros de busca
 * @param {number} [debounceMs=500] - Tempo de debounce em milissegundos
 * 
 * @returns {{
 *   questions: Array,
 *   isLoading: boolean,
 *   error: string | null,
 *   hasSearched: boolean
 * }}
 */
const useQuestionSearch = (filters = {}, debounceMs = 500) => {
  // Implementação do hook...

  return {
    questions,
    isLoading,
    error,
    hasSearched
  };
};

export default useQuestionSearch;
```

### Context e Provider

```javascript
// SavedQuestionsContext.jsx

import React, { createContext, useState, useEffect } from 'react';

export const SavedQuestionsContext = createContext();

export const SavedQuestionsProvider = ({ children }) => {
  const [savedQuestionIds, setSavedQuestionIds] = useState(() => {
    // Inicialização com localStorage
  });

  // Lógica do provider...

  const value = {
    savedQuestionIds,
    addSavedQuestion,
    removeSavedQuestion,
    isQuestionSaved
  };

  return (
    <SavedQuestionsContext.Provider value={value}>
      {children}
    </SavedQuestionsContext.Provider>
  );
};
```

## 🎬 Animações com Framer Motion

**Import correto:**
```javascript
import { motion as Motion, AnimatePresence } from 'motion/react';
```

**Padrões de uso:**
```javascript
// Animação simples de fade-in
<Motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {/* Conteúdo */}
</Motion.div>

// Com variants para efeitos mais complexos
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.03 }
};

<Motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  whileHover="hover"
>
  {/* Card animado */}
</Motion.div>
```

## 📱 Responsividade

**Breakpoints padrão:**
- Desktop: > 768px
- Tablet: 481px - 768px
- Mobile: ≤ 480px

**Padrão mobile-first:**
```css
/* Estilos base (mobile) */
.my-component {
  padding: 20px 15px;
}

/* Tablet */
@media (min-width: 481px) {
  .my-component {
    padding: 30px 20px;
  }
}

/* Desktop */
@media (min-width: 769px) {
  .my-component {
    padding: 40px 30px;
  }
}
```

## 🚫 Restrições Importantes

### Browser Storage

**NUNCA use localStorage ou sessionStorage em artifacts:**
```javascript
// ❌ PROIBIDO em artifacts
localStorage.setItem('key', 'value');
sessionStorage.getItem('key');

// ✅ USE React state ou window.storage (API específica para artifacts)
const [state, setState] = useState(initialValue);
```

### Bibliotecas Disponíveis

**Imports permitidos:**
```javascript
// React e relacionados
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Animações
import { motion as Motion } from 'motion/react';

// Markdown
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Ícones (lucide-react se necessário)
import { Camera } from 'lucide-react';
```

## 🎯 Features Específicas

### Calculadora PAVE

**Design System: Duolingo-style**
- Botões com sombra: `box-shadow: 0 4px 0 color`
- Efeito tátil no clique: `transform: translateY(4px)`
- Cores vibrantes para seleção
- Inputs com steppers customizados (+/-)

**Constantes importantes:**
```javascript
import {
  TOTAL_QUESTOES,      // 32
  PONTOS_ACERTO_E1E2,  // 3.125
  PESO_ETAPA_3,        // 3
  WIZARD_STEPS         // Objeto com steps do wizard
} from '../constants';
```

### Banco de Questões

**Estrutura de Questão:**
```javascript
{
  id: "unique-id",
  ano: 2024,
  etapa: 1,
  materia: "História",
  topico: "Brasil Colônia",
  corpo_questao: [
    { tipo: "texto", conteudo: "..." },
    { tipo: "imagem", url_imagem: "...", legenda: "..." }
  ],
  alternativas: [
    { letra: "A", texto: "..." },
    // ...
  ],
  gabarito: "A"
}
```

**Componente QuestionLayout:**
- Usa `ReactMarkdown` para renderizar texto
- Suporta KaTeX para fórmulas matemáticas
- Sistema de feedback visual para respostas
- Menu de contexto para salvar questões

### Sistema de Salvamento

**Context Provider:**
```javascript
import { useSavedQuestions } from '../hooks/useSavedQuestions';

const { 
  savedQuestionIds,
  addSavedQuestion,
  removeSavedQuestion,
  isQuestionSaved 
} = useSavedQuestions();
```

## 🔍 Padrões de API/Fetch

**Estrutura de chamadas:**
```javascript
const fetchData = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/endpoint');
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }
    
    const data = await response.json();
    setData(data);
  } catch (err) {
    console.error('Erro:', err);
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

## ✅ Checklist para Novos Componentes

Ao criar um novo componente, certifique-se de:

- [ ] Nome do arquivo em PascalCase.jsx
- [ ] CSS correspondente criado (se necessário)
- [ ] Imports organizados por categoria
- [ ] JSDoc para props/funções principais
- [ ] Suporte a dark mode implementado
- [ ] Responsividade testada (mobile/tablet/desktop)
- [ ] Estados de loading/error tratados
- [ ] Acessibilidade básica (aria-labels)
- [ ] Componente exportado como default
- [ ] Sem uso de localStorage/sessionStorage em artifacts

## 🐛 Debugging

**Console logs úteis:**
```javascript
// Durante desenvolvimento
console.log('Estado atual:', { isLoading, data, error });

// Em produção, use console.error para erros
console.error('Falha ao carregar dados:', error);

// Evite console.log em produção (remova antes do commit)
```

## 📚 Recursos Úteis

- **React Router:** Navegação com `<Link>` e `useNavigate()`
- **Framer Motion:** [motion.dev](https://motion.dev)
- **React Markdown:** Renderização de markdown com suporte a LaTeX
- **KaTeX:** Renderização de fórmulas matemáticas

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Lint
npm run lint

# Preview da build
npm run preview
```

