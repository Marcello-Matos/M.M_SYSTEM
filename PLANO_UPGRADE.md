# Plano de Upgrade - M.M System
## Controle de Estoque & Vendas

---

## Fase 1: Design System + Tokens Visuais
**Objetivo:** Criar a base visual consistente para todo o sistema

- [ ] Criar arquivo `design-tokens.css` com:
  - Paleta de cores (primária, secundária, neutros, semânticas)
  - Tipografia (fontes, tamanhos, pesos)
  - Espaçamentos (padding, margin, gap tokens)
  - Bordas e sombras (border-radius, box-shadow tokens)
  - Breakpoints responsivos
- [ ] Refatorar `styles.css` para usar os tokens
- [ ] Criar componentes base reutilizáveis (botões, inputs, cards)

**Entrega:** Sistema visual consistente, fácil de manter

---

## Fase 2: Dark Mode Premium
**Objetivo:** Tema escuro com glassmorphism e neon sutil

- [ ] Implementar toggle dark/light mode
- [ ] Criar variáveis CSS para dark mode
- [ ] Aplicar glassmorphism nos cards e modais
- [ ] Adicionar blur e transparência controlada
- [ ] Neon sutil em elementos ativos/foco
- [ ] Gradientes sofisticados no dark mode

**Entrega:** Tema escuro premium, toggle funcional

---

## Fase 3: Motion Design
**Objetivo:** Animações suaves e profissionais

- [ ] Loading states animados (spinner, skeleton)
- [ ] Transições de tela (fade, slide)
- [ ] Micro-interações nos botões (hover, click)
- [ ] Animação nos cards de entrada
- [ ] Toast notifications com slide-in
- [ ] Modal open/close com scale + fade

**Entrega:** Sistema com movimento fluido e profissional

---

## Fase 4: UX Real
**Objetivo:** Experiência completa e polida

- [ ] Onboarding para primeiro acesso
- [ ] Empty states bonitos (sem produtos, sem vendas)
- [ ] Skeleton screens durante loading
- [ ] Feedback visual em todas as ações
- [ ] Estados de erro amigáveis
- [ ] Confirmações visuais (delete, logout)

**Entrega:** Experiência de usuário completa e refinada

---

## Fase 5: Branding Forte
**Objetivo:** Identidade visual memorável

- [ ] Definir slogan oficial
- [ ] Criar linguagem visual fixa
- [ ] Padronizar ícones (Font Awesome já usado, revisar consistência)
- [ ] Documentação visual básica
- [ ] Favicon e meta tags para PWA

**Entrega:** Identidade visual coesa e profissional

---

## Ordem de execução:
1. Fase 1 → 2 → 3 → 4 → 5
2. Cada fase precisa da sua aprovação antes da próxima
3. Posso pausar a qualquer momento se precisar ajustar algo

---

## Estimativa:
- Cada fase: 1-2 dias de trabalho
- Total: ~1 semana

**Quer começar pela Fase 1?**
