# FinBot — agente financeiro no Telegram

**Controle financeiro pessoal por conversa.** Manda "gastei 150 no mercado", um áudio ou a foto do
comprovante — a transação é interpretada, categorizada e registrada. Sem formulário, sem planilha.

Além do bot, o projeto tem um painel web para o que não cabe numa conversa: relatórios, orçamento
mensal e acompanhamento de investimentos.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram%20Bot-26A5E4?style=flat-square&logo=telegram&logoColor=white)

> Este projeto é a origem do **[Elsy](https://github.com/gilliardd/elsy)** — a mesma ideia
> reconstruída como SaaS multi-tenant, no WhatsApp e com assinatura recorrente.

---

## O que ele faz

**Três formas de registrar, todas pela conversa**
Texto vira transação estruturada por modelo de linguagem. Áudio passa por transcrição automática.
Foto de comprovante — PIX, nota fiscal, recibo, boleto ou fatura — passa por visão computacional.
Os três caminhos terminam no mesmo lançamento, com botões de confirmação no próprio Telegram.

**Controle financeiro completo**
Receitas e despesas com categorias, contas a pagar com lembrete de vencimento, caixinhas de reserva
com meta, carteira de investimentos com aportes, resgates e proventos, e orçamento por categoria.

**Orçamento mensal por regra**
Suporta 50-30-20, 60-20-20, 40-30-30 ou divisão personalizada. A renda esperada do mês é distribuída
em três baldes — necessidades, estilo de vida e futuro — e o realizado é comparado com o planejado.

**Lembrete de conta antes do vencimento**
Cada conta define quantos dias antes quer ser avisada; um agendador dispara o lembrete no Telegram e
registra a data do último aviso, para não repetir.

---

## Decisões técnicas que valem nota

**Filtro barato antes da chamada cara.**
Nem toda mensagem vai para o modelo. Um pré-filtro exige que o texto tenha número *e* alguma palavra
do vocabulário financeiro antes de gastar uma chamada de IA. Conversa solta não vira custo.

**As categorias vêm do banco para dentro do prompt.**
A lista de categorias válidas é lida do banco e injetada no prompt do sistema em cada chamada.
Criar uma categoria nova é um `INSERT` — não exige tocar no código nem reescrever prompt.

**A saída do modelo é tratada como não confiável.**
A resposta passa por remoção de cercas de markdown, validação dos campos obrigatórios, normalização
do valor (vírgula para ponto) e checagem da data por expressão regular, com o dia de hoje como
fallback. Se algo não bate, o lançamento não acontece.

**Saída determinística por configuração.**
Temperatura em 0.1 e teto de tokens curto na extração de transação: a tarefa é estruturar dado, não
gerar texto criativo. O modelo também devolve um grau de confiança junto com o resultado.

**Datas relativas resolvidas fora do modelo.**
"Hoje" e "ontem" são calculados no servidor e entregues prontos ao prompt, em vez de deixar o modelo
inferir a data — o que evita erro de fuso e de virada de dia.

**Falha ruidosa na partida, saída limpa no fim.**
Sem banco, o processo encerra na inicialização em vez de subir pela metade. E `SIGINT`/`SIGTERM`
param o bot e fecham o servidor antes de sair, para não deixar conexão pendurada no restart.

**Um processo só.**
A mesma aplicação serve a API, o bot e a SPA já compilada, com fallback de rota que preserva o
prefixo `/api`. Um deploy, uma porta.

---

## Como está construído

```
Mensagem no Telegram
   ├── comando        → handler de comandos
   ├── botão          → handler de callback (confirmar / cancelar)
   ├── áudio          → transcrição → mesmo fluxo do texto
   ├── imagem         → visão computacional → transação
   └── texto
        └── pré-filtro: tem número e palavra financeira?
             └── modelo de linguagem → JSON validado → transação
```

---

## Rodando localmente

Requer Node.js e MySQL.

```bash
npm run setup     # dependências, build do frontend e schema do banco
npm run dev       # backend com recarga automática
```

Produção: `npm run build` e `npm start`.
API sob `/api`, com `/api/health` para checagem.

---

<details>
<summary><b>Referência — API, banco e estrutura</b></summary>

### API

| Área | Rotas |
|---|---|
| Finanças | `transactions` · `categories` · `bills` · `savingsBoxes` · `budgets` |
| Patrimônio | `assets` · `assetMovements` |
| Análise | `dashboard` · `reports` |
| Sistema | `auth` · `system` |

### Banco

MySQL em utf8mb4, InnoDB. Schema em `database/schema.sql` mais migrations incrementais em
`database/migrations/`. O schema já traz as categorias padrão de despesa, receita e investimento,
as contas iniciais e as configurações do sistema.

Tabelas principais: `categories`, `transactions`, `budgets`, `monthly_budgets`,
`monthly_budget_items`, `investments`, `investment_transactions`, `savings_boxes`,
`savings_box_transactions`, `bills`, `cash_accounts`, `alerts`, `settings`.

### Estrutura

```
├── database          schema e migrations
├── frontend          SPA em Vite
├── src
│   ├── bot           handlers de comando, mensagem, mídia e callback + teclados
│   ├── config        ambiente e conexão com o banco
│   ├── controllers
│   ├── database      runner de migrations
│   ├── middlewares   tratamento de erro e 404
│   ├── models
│   ├── routes
│   ├── services      integração com IA e agendador de contas
│   └── utils
└── finbot-spec.md    especificação completa do sistema
```

</details>
