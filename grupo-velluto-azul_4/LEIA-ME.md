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
4. Faça o deploy. As tabelas (`users`, `invoices`, `projects`) são criadas sozinhas na primeira requisição
   (o mesmo SQL está em `db/schema.sql` se preferir rodar à mão no Neon).

## Páginas
| Rota | O que é |
|---|---|
| `/my/` | Entrar / criar conta (nome, e-mail, telefone, senha, confirmar senha). Logado: editar dados, trocar senha, desativar, apagar, ver se é cliente |
| `/accessibility/` | Idioma (PT/EN/ES) e modo claro/escuro/automático. Salva na conta se estiver logado |
| `/cliente/` | Só clientes (projetos) |
| `/financial/` | Só clientes (faturas, totais, vencimentos) |
| `/financeiro/criarpagamentos` | Pede a senha (`PAY_PIN`), você digita o valor e ele gera link, QR Code Pix e Pix copia-e-cola, e mostra "Aprovado" sozinho |
| `/financeiro/pagar?id=…` | Link que o cliente abre: mostra o valor, o QR Code e o status |
| `/admin/` | Só admins: marcar quem é cliente, criar faturas e projetos |

Quem não é cliente não vê Cliente/Financeiro no menu nem na conta, e é redirecionado se abrir o endereço direto.

## Segurança
Senhas com scrypt, sessão em cookie HttpOnly assinado, desativar/apagar exigem a senha, e a API checa permissão no servidor (não só no site).

## Traduzir mais texto
Edite `js/i18n.js`: o texto em português é a chave, e o valor é `[inglês, espanhol]`.

## Pagamentos Pix (Mercado Pago)
A API cria o Pix em `/v1/payments`, guarda na tabela `payments` e confirma o status direto no Mercado Pago (consulta a cada 4 s + webhook em `/api/app?r=pay/webhook`, enviado como `notification_url`). Após 8 senhas erradas, o IP é bloqueado por 15 min.
