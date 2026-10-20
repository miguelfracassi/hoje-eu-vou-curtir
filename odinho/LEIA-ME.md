# Grupo Velluto – site + contas (Vercel + Neon)

## Como colocar no ar
1. Suba esta pasta para o GitHub e importe na Vercel (ou `vercel` pela CLI).
2. Na Vercel: **Storage → Neon → Create/Connect**. Isso cria a variável `DATABASE_URL` sozinha.
3. Em **Settings → Environment Variables** adicione:
   - `SESSION_SECRET` – texto aleatório longo (`openssl rand -base64 48`)
   - `ADMIN_EMAILS` – seu e-mail (quem se cadastrar com ele vira admin e cliente automaticamente)
4. Faça o deploy. As tabelas (`users`, `invoices`, `projects`) são criadas sozinhas na primeira requisição
   (o mesmo SQL está em `db/schema.sql` se preferir rodar à mão no Neon).

## Páginas
| Rota | O que é |
|---|---|
| `/my/` | Entrar / criar conta (nome, e-mail, telefone, senha, confirmar senha). Logado: editar dados, trocar senha, desativar, apagar, ver se é cliente |
| `/accessibility/` | Idioma (PT/EN/ES) e modo claro/escuro/automático. Salva na conta se estiver logado |
| `/cliente/` | Só clientes (projetos) |
| `/financial/` | Só clientes (faturas, totais, vencimentos) |
| `/admin/` | Só admins: marcar quem é cliente, criar faturas e projetos |

Quem não é cliente não vê Cliente/Financeiro no menu nem na conta, e é redirecionado se abrir o endereço direto.

## Segurança
Senhas com scrypt, sessão em cookie HttpOnly assinado, desativar/apagar exigem a senha, e a API checa permissão no servidor (não só no site).

## Traduzir mais texto
Edite `js/i18n.js`: o texto em português é a chave, e o valor é `[inglês, espanhol]`.
