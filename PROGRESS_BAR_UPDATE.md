# 🔧 Correção - Barra de Progresso Horizontal

## Mudanças Implementadas

### ✅ Layout Horizontal
A barra de progresso agora está **ao lado do botão de voltar** (não mais em cima), seguindo o design da imagem de referência.

### 📐 Estrutura Atualizada

**Antes:**
```
.calc-wizard-header (flex-column)
  ├── .progress-bar (topo, largura total)
  └── .calc-wizard-back-wrapper
       └── button (embaixo)
```

**Depois:**
```
.calc-wizard-header (flex-row)
  ├── .calc-wizard-back-button (esquerda, 40x40px)
  └── .progress-bar (direita, flex: 1)
```

### 🎨 Estilo Flat

**Barra de Progresso:**
- Altura: `8px` (desktop)
- Border-radius: `8px` (cantos arredondados)
- Background: `var(--progress-bar-bg)` (cor sutil)
- Fill: `var(--progress-fill-color)` (verde PAVE)

**Botão de Voltar:**
- Tamanho: `40x40px` (fixo)
- Border-radius: `8px`
- Hover sutil com fundo cinza
- Ícone SVG de seta

### 👁️ Visibilidade

**Sempre Visível:**
- ✅ TelaSelecaoEtapas (tela inicial)
- ✅ TelaDesempenho (etapas 1, 2, 3)
- ✅ TelaDesempenhoRedacao
- ✅ TelaSelecaoCurso

**Oculto:**
- ❌ TelaResultado (tela final)

### 📱 Responsividade

**Desktop (>768px):**
- Header padding: `16px 20px`
- Gap entre botão e barra: `16px`
- Barra altura: `8px`

**Tablet (≤768px):**
- Header padding: `12px 16px`
- Gap: `12px`

**Mobile (≤480px):**
- Header padding: `10px 12px`
- Gap: `10px`
- Botão: `36x36px`
- Barra altura: `6px`

## 🎯 Resultado

O header agora tem uma aparência mais limpa e moderna, com a barra de progresso crescendo horizontalmente à medida que o usuário avança pelas etapas, exatamente como mostrado na imagem de referência.

### Layout Visual

```
┌─────────────────────────────────────────┐
│  [←]  ━━━━━━━━━━━━━━━━━░░░░░░░░░░░    │
│  btn         progresso (60%)            │
└─────────────────────────────────────────┘
```

---

**Status:** ✅ Implementado e Testado
**Arquivos Modificados:** 2
- `CalculadoraPage.jsx`
- `CalculadoraWizard.css`
