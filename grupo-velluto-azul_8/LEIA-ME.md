# Grupo Velluto – site + contas (Vercel + Neon)

## Como colocar no ar
1. Suba esta pasta para o GitHub e importe na Vercel (ou `vercel` pela CLI).
2. Na Vercel: **Storage → Neon → Create/Connect**. Isso cria a variável `DATABASE_URL` sozinha.
3. Em **Settings → Environment Variables** adicione:
   - `SESSION_SECRET` – texto aleatório longo (`openssl rand -base64 48`)
   - `ADMIN_EMAILS` – seu e-mail (quem se cadastrar com ele vira admin e cliente automaticamente)
   - `MP_ACCESS_TOKEN` – Access Token de **produção** do Mercado Pago (Seu negócio → Credenciais)
   - `PAY_PIN` – senha de `/financeiro/criarpagamentos` (se não definir, vale `0000`; recomendo trocar)
   - `MP_PAYER_EMAIL` – opcional, e-mail "pagador" enviado ao criar o Pix
   - `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` – chaves das notificações no celular. Gere o par uma vez com `npx web-push generate-vapid-keys`
   - `VAPID_SUBJECT` – opcional, `mailto:` de contato (padrão: atendimentovelluto@aol.com)
   - `CRON_SECRET` – texto aleatório longo; a Vercel o usa para chamar o aviso diário (veja "Avisos de vencimento")
4. Faça o deploy. As tabelas (`users`, `invoices`, `projects`, `payments`, `push_subs`, `notifications`, `chat_messages`) são criadas sozinhas na primeira requisição
   (o mesmo SQL está em `db/schema.sql` se preferir rodar à mão no Neon).

## Páginas
| Rota | O que é |
|---|---|
| `/my/` | Entrar / criar conta (nome, e-mail, telefone, senha, confirmar senha). Logado: editar dados, trocar senha, desativar, apagar, ver se é cliente |
| `/accessibility/` | Idioma (PT/EN/ES) e modo claro/escuro/automático. Salva na conta se estiver logado |
| `/cliente/` | Só clientes (projetos) |
| `/financial/` | Qualquer conta logada: clientes veem faturas; todos veem "Meus apoios por mês" |
| `/financeiro/criarpagamentos` | Pede a senha (`PAY_PIN`), você digita o valor e ele gera link, QR Code Pix e Pix copia-e-cola, e mostra "Aprovado" sozinho |
| `/financeiro/pagar?id=…` | Link que o cliente abre: mostra o valor, o QR Code e o status |
| `/apoie/` | Apoio ao grupo (por dia, mensal ou anual, via Pix). Precisa de conta. Mínimo R$ 1,00 (dia/mês) e R$ 5,00 (ano) |
| `/admin/` | Só admins: marcar quem é cliente, criar faturas e projetos, aprovar/recusar cancelamentos, abrir o chat do cliente |
| `/financeiro/fatura?id=…` | Fatura individual (dono ou admin): detalhes, imprimir/salvar em PDF e pedir cancelamento |
| `/chat/` | Cliente (qualquer conta logada): conversa com a equipe. Admin: lista de conversas, busca de cliente e respostas |

Quem não é cliente não vê Cliente/Financeiro no menu nem na conta, e é redirecionado se abrir o endereço direto.

## Segurança
Senhas com scrypt, sessão em cookie HttpOnly assinado, desativar/apagar exigem a senha, e a API checa permissão no servidor (não só no site).

## Traduzir mais texto
Edite `js/i18n.js`: o texto em português é a chave, e o valor é `[inglês, espanhol]`.

## Pagamentos Pix (Mercado Pago)
A API cria o Pix em `/v1/payments`, guarda na tabela `payments` e confirma o status direto no Mercado Pago (consulta a cada 4 s + webhook em `/api/app?r=pay/webhook`, enviado como `notification_url`). Após 8 senhas erradas, o IP é bloqueado por 15 min.

## Compras, faturas e cancelamentos
- `/financial/` agora tem **Compras futuras** (faturas ainda a vencer, com "Vence hoje" / "Vence amanhã"), **Faturas** (com Ver e Cancelar) e **Meus apoios por mês**.
- **Fatura**: o cliente **pede** o cancelamento; a fatura fica "Cancelamento solicitado", cai uma mensagem no chat e a equipe é avisada. No `/admin/` você **aprova** (vira "Cancelada" e sai do "Em aberto") ou **recusa**. Fatura já paga não cancela: a tela manda falar no chat.
- **Apoio (Pix) ainda não pago**: o cliente cancela na hora, e o Pix também é cancelado no Mercado Pago (o QR deixa de valer). Apoio já aprovado não cancela por aqui.
- Os apoios são Pix avulsos (não há cobrança automática recorrente), então "compras futuras" são as faturas criadas pelo admin.

## Aplicativo (PWA) e notificações
- O site é instalável: `manifest.webmanifest`, `sw.js` (service worker) e ícones em `assets/icon-*.png`. No Android/Chrome/Edge/desktop aparece o botão **Instalar aplicativo** no menu e em Minha conta. No iPhone: Safari → Compartilhar → Adicionar à Tela de Início (as notificações no iPhone só funcionam com o app instalado, iOS 16.4+).
- Em **Minha conta → Aplicativo e notificações** o cliente liga/desliga as notificações daquele aparelho e envia um teste. Ao sair da conta, o aparelho deixa de receber os avisos dela.
- Quem recebe aviso: cliente → nova fatura, pagamento confirmado, cancelamento aprovado/recusado, resposta no chat e "vence amanhã / vence hoje / venceu ontem". Equipe → mensagem nova no chat e pedido de cancelamento.
- Sem `VAPID_*` configurado o site funciona normalmente, só não envia push (o painel avisa).

## Avisos de vencimento (cron)
`vercel.json` agenda `/api/cron` todo dia às 11:00 UTC (08:00 em Brasília). A Vercel manda `Authorization: Bearer <CRON_SECRET>`, e sem essa variável a rota recusa qualquer chamada. Cada aviso é enviado uma única vez por fatura. No plano Hobby o cron roda no máximo 1x por dia; para outro horário, ajuste o `schedule`.

## Chat
Não há websocket (a Vercel é serverless): a página consulta o servidor a cada 3 s com a aba aberta e a cada 15 s em segundo plano; com o app fechado, quem avisa é a notificação push. Mensagens de até 2000 caracteres, limite de 20 por minuto por pessoa.
