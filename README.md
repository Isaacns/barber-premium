# Vizio Barber (ex-Barber Premium)

Sistema de gerenciamento de barbearias — **produto VIZIO** (multi-barbearia, white-label
via Camaleão), um produto **INPERSON**. "O seu negócio na palma da mão."

**Identidade: TEMA AURA** (v0.2.0) — derivada do Sistema INPERSON: AURA Clara (porcelana +
azul #1C64F0 + violeta) como padrão, fundo com respiração, partículas vivas, brilho no
cursor, halos, dock de navegação flutuante. AURA Noturna no toggle. Sem herança visual
do Vizio Motors.

## Rodar
Abrir `index.html` no navegador. Logins demo (senha livre):
`admin` · `gerente` · `barbeiro` (Diego) · `cliente` (Lucas — abre a Área do Cliente).

## Módulos
Início (radar) · Agenda (confirmação, atraso c/ tolerância 15min, no-show, aviso ao barbeiro
15min antes) · Clientes (frequência, aniversário, 5% 1º serviço) · Serviços · Barbeiros &
Produtividade (comissão, gorjetas, avaliações) · Estoque (insumos + produtos) · SHOP (pedidos,
retirada na unidade) · Financeiro (+ Saúde do Negócio 0–100) · Nota Fiscal (simulada) ·
Dashboard Executivo · Alavancagem (recuperação, aniversários, combos) · Relatórios PDF ·
Bem-estar (padrão Inovar) · Usuários & Acessos (RBAC) · Identidade/Camaleão.

## Área do Cliente
Agendar (10% off antecipado), confirmar presença, reportar atraso, alerta **"você é o
próximo"**, histórico, avaliação ⭐, gorjeta 💛, SHOP com pagamento no sistema, aniversário.

## Pagamentos
`PAYGATE` (app-crud.js) — camada abstrata plugável. Hoje: provedor **simulado**.
Go-live: implementar `providers.stripe|pix|mercadopago` e trocar `DADOS._cfg.gateway`.

## Arquivos
`index.html` (shell premium, temas, Movimento Vivo) · `dados.js` (seed demo) ·
`app.js` (núcleo + operação + portal do cliente) · `gestao.js` (gestão + inteligência) ·
`app-crud.js` (CRUD + PAYGATE + relatórios + hook `API_URL`) · `bemestar.js` · `rbac.js` ·
`theme.js` (Camaleão + tema claro/escuro + logo por tema).

Go-live: ver `../04_Documentos/GUIA-GO-LIVE.md`.
