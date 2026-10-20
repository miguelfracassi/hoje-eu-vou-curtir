/* API do Grupo Velluto: contas, preferências, área do cliente, financeiro e admin.
   Roda na Vercel (Node) com banco Neon (Postgres). */
const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const SECRET = process.env.SESSION_SECRET || '';
const ADMINS = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
const COOKIE = 'vs_session', DAYS = 30;

let sql, ready;
function db() { if (!sql) sql = neon(DB_URL); return sql; }
function q(text, params) { return db().query(text, params || []); }
function init() {
  if (!ready) ready = (async () => {
    await q(`CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL, pass_hash TEXT NOT NULL, is_client BOOLEAN NOT NULL DEFAULT FALSE, is_admin BOOLEAN NOT NULL DEFAULT FALSE, status TEXT NOT NULL DEFAULT 'active', theme TEXT NOT NULL DEFAULT 'light', lang TEXT NOT NULL DEFAULT 'pt', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await q(`CREATE TABLE IF NOT EXISTS invoices (id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, description TEXT NOT NULL, amount_cents INTEGER NOT NULL, due_date DATE, paid BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await q(`CREATE TABLE IF NOT EXISTS projects (id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Em andamento', note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  })().catch(e => { ready = null; throw e; });
  return ready;
}

/* ---------- senha (scrypt) e sessão (cookie assinado) ---------- */
function hashPass(p) {
  const salt = crypto.randomBytes(16);
  return 's1$' + salt.toString('base64') + '$' + crypto.scryptSync(p, salt, 64).toString('base64');
}
function checkPass(p, stored) {
  try {
    const [, s, h] = stored.split('$');
    const a = crypto.scryptSync(p, Buffer.from(s, 'base64'), 64), b = Buffer.from(h, 'base64');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (e) { return false; }
}
const b64 = b => Buffer.from(b).toString('base64url');
function sign(v) { return crypto.createHmac('sha256', SECRET).update(v).digest('base64url'); }
function makeToken(id) { const p = b64(JSON.stringify({ id, exp: Date.now() + DAYS * 864e5 })); return p + '.' + sign(p); }
function readToken(t) {
  if (!t || !SECRET) return null;
  const [p, s] = t.split('.'); if (!p || !s) return null;
  const e = sign(p); if (e.length !== s.length || !crypto.timingSafeEqual(Buffer.from(e), Buffer.from(s))) return null;
  try { const d = JSON.parse(Buffer.from(p, 'base64url').toString()); return d.exp > Date.now() ? d : null; } catch (e) { return null; }
}
function cookies(req) {
  const o = {}; (req.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) o[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return o;
}
function setCookie(res, val, maxAge) {
  res.setHeader('Set-Cookie', `${COOKIE}=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
}

/* ---------- utilidades ---------- */
class HttpError extends Error { constructor(status, code, msg) { super(msg || code); this.status = status; this.code = code; } }
const bad = (code, msg) => new HttpError(400, code, msg);
const clean = (s, max) => String(s == null ? '' : s).trim().slice(0, max || 200);
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const digits = s => String(s || '').replace(/\D/g, '');
function pub(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, is_client: u.is_client, is_admin: u.is_admin, status: u.status, theme: u.theme, lang: u.lang, created_at: u.created_at };
}
function checkPassword(p, c) {
  if (typeof p !== 'string' || p.length < 8) throw bad('weak_password', 'A senha precisa ter pelo menos 8 caracteres.');
  if (p.length > 100) throw bad('weak_password', 'Senha muito longa.');
  if (c !== undefined && p !== c) throw bad('password_mismatch', 'As senhas não conferem.');
}
async function userFromReq(req) {
  const t = readToken(cookies(req)[COOKIE]); if (!t) return null;
  const r = await q('SELECT * FROM users WHERE id=$1', [t.id]);
  const u = r[0]; return u && u.status === 'active' ? u : null;
}
async function needUser(req) { const u = await userFromReq(req); if (!u) throw new HttpError(401, 'auth', 'Entre na sua conta.'); return u; }
async function needAdmin(req) { const u = await needUser(req); if (!u.is_admin) throw new HttpError(403, 'forbidden', 'Sem permissão.'); return u; }
async function needClient(req) { const u = await needUser(req); if (!u.is_client && !u.is_admin) throw new HttpError(403, 'not_client', 'Área exclusiva para clientes.'); return u; }
async function confirmPassword(u, p) { if (!checkPass(String(p || ''), u.pass_hash)) throw new HttpError(403, 'wrong_password', 'Senha incorreta.'); }

/* ---------- rotas ---------- */
const routes = {
  'GET /me': async (req) => { const u = await userFromReq(req); return { user: u ? pub(u) : null }; },

  'POST /register': async (req, res, b) => {
    const name = clean(b.name, 100), email = clean(b.email, 160).toLowerCase(), phone = clean(b.phone, 30);
    if (name.length < 2) throw bad('name', 'Informe seu nome.');
    if (!emailOk(email)) throw bad('email', 'E-mail inválido.');
    const d = digits(phone); if (d.length < 10 || d.length > 13) throw bad('phone', 'Telefone inválido. Use DDD + número.');
    checkPassword(b.password, b.confirm);
    if ((await q('SELECT 1 FROM users WHERE email=$1', [email])).length) throw new HttpError(409, 'email_taken', 'Já existe uma conta com esse e-mail.');
    const admin = ADMINS.includes(email);
    const r = await q('INSERT INTO users(name,email,phone,pass_hash,is_admin,is_client,theme,lang) VALUES($1,$2,$3,$4,$5,$5,$6,$7) RETURNING *', [name, email, phone, hashPass(b.password), admin, ['light', 'dark', 'auto'].includes(b.theme) ? b.theme : 'light', ['pt', 'en', 'es'].includes(b.lang) ? b.lang : 'pt']);
    setCookie(res, makeToken(r[0].id), DAYS * 86400);
    return { user: pub(r[0]) };
  },

  'POST /login': async (req, res, b) => {
    const email = clean(b.email, 160).toLowerCase();
    const r = await q('SELECT * FROM users WHERE email=$1', [email]); const u = r[0];
    if (!u || !checkPass(String(b.password || ''), u.pass_hash)) throw new HttpError(401, 'bad_login', 'E-mail ou senha incorretos.');
    if (u.status !== 'active') {
      if (!b.reactivate) throw new HttpError(403, 'deactivated', 'Esta conta está desativada.');
      await q("UPDATE users SET status='active' WHERE id=$1", [u.id]); u.status = 'active';
    }
    if (ADMINS.includes(email) && !u.is_admin) { await q('UPDATE users SET is_admin=TRUE WHERE id=$1', [u.id]); u.is_admin = true; }
    setCookie(res, makeToken(u.id), DAYS * 86400);
    return { user: pub(u) };
  },

  'POST /logout': async (req, res) => { setCookie(res, '', 0); return { ok: true }; },

  'POST /profile': async (req, res, b) => {
    const u = await needUser(req);
    const name = clean(b.name, 100), email = clean(b.email, 160).toLowerCase(), phone = clean(b.phone, 30);
    if (name.length < 2) throw bad('name', 'Informe seu nome.');
    if (!emailOk(email)) throw bad('email', 'E-mail inválido.');
    const d = digits(phone); if (d.length < 10 || d.length > 13) throw bad('phone', 'Telefone inválido. Use DDD + número.');
    if (email !== u.email && (await q('SELECT 1 FROM users WHERE email=$1 AND id<>$2', [email, u.id])).length) throw new HttpError(409, 'email_taken', 'Já existe uma conta com esse e-mail.');
    const r = await q('UPDATE users SET name=$1,email=$2,phone=$3 WHERE id=$4 RETURNING *', [name, email, phone, u.id]);
    return { user: pub(r[0]) };
  },

  'POST /password': async (req, res, b) => {
    const u = await needUser(req);
    await confirmPassword(u, b.current);
    checkPassword(b.password, b.confirm);
    await q('UPDATE users SET pass_hash=$1 WHERE id=$2', [hashPass(b.password), u.id]);
    return { ok: true };
  },

  'POST /prefs': async (req, res, b) => {
    const u = await needUser(req);
    const theme = ['light', 'dark', 'auto'].includes(b.theme) ? b.theme : u.theme;
    const lang = ['pt', 'en', 'es'].includes(b.lang) ? b.lang : u.lang;
    const r = await q('UPDATE users SET theme=$1,lang=$2 WHERE id=$3 RETURNING *', [theme, lang, u.id]);
    return { user: pub(r[0]) };
  },

  'POST /deactivate': async (req, res, b) => {
    const u = await needUser(req); await confirmPassword(u, b.password);
    await q("UPDATE users SET status='deactivated' WHERE id=$1", [u.id]); setCookie(res, '', 0);
    return { ok: true };
  },

  'POST /delete': async (req, res, b) => {
    const u = await needUser(req); await confirmPassword(u, b.password);
    await q('DELETE FROM users WHERE id=$1', [u.id]); setCookie(res, '', 0);
    return { ok: true };
  },

  /* área do cliente */
  'GET /cliente': async (req) => {
    const u = await needClient(req);
    return { projects: await q('SELECT id,title,status,note,created_at FROM projects WHERE user_id=$1 ORDER BY created_at DESC', [u.id]) };
  },
  'GET /financial': async (req) => {
    const u = await needClient(req);
    return { invoices: await q('SELECT id,description,amount_cents,due_date,paid,created_at FROM invoices WHERE user_id=$1 ORDER BY paid ASC, due_date ASC NULLS LAST, id DESC', [u.id]) };
  },

  /* admin */
  'GET /admin/users': async (req) => {
    await needAdmin(req);
    const users = await q('SELECT id,name,email,phone,is_client,is_admin,status,created_at FROM users ORDER BY created_at DESC LIMIT 500');
    const invoices = await q('SELECT id,user_id,description,amount_cents,due_date,paid FROM invoices ORDER BY id DESC LIMIT 1000');
    const projects = await q('SELECT id,user_id,title,status,note FROM projects ORDER BY id DESC LIMIT 1000');
    return { users, invoices, projects };
  },
  'POST /admin/client': async (req, res, b) => {
    const me = await needAdmin(req);
    await q('UPDATE users SET is_client=$1 WHERE id=$2', [!!b.is_client, Number(b.id)]); return { ok: true };
  },
  'POST /admin/invoice': async (req, res, b) => {
    await needAdmin(req);
    const cents = Math.round(Number(String(b.amount).replace(',', '.')) * 100);
    const desc = clean(b.description, 200);
    if (!desc || !Number.isFinite(cents) || cents <= 0) throw bad('invoice', 'Informe descrição e valor.');
    const due = /^\d{4}-\d{2}-\d{2}$/.test(b.due_date || '') ? b.due_date : null;
    await q('INSERT INTO invoices(user_id,description,amount_cents,due_date) VALUES($1,$2,$3,$4)', [Number(b.user_id), desc, cents, due]); return { ok: true };
  },
  'POST /admin/invoice-paid': async (req, res, b) => { await needAdmin(req); await q('UPDATE invoices SET paid=$1 WHERE id=$2', [!!b.paid, Number(b.id)]); return { ok: true }; },
  'POST /admin/project': async (req, res, b) => {
    await needAdmin(req);
    const title = clean(b.title, 160); if (!title) throw bad('project', 'Informe o título.');
    await q('INSERT INTO projects(user_id,title,status,note) VALUES($1,$2,$3,$4)', [Number(b.user_id), title, clean(b.status, 40) || 'Em andamento', clean(b.note, 500)]); return { ok: true };
  },
  'POST /admin/remove': async (req, res, b) => {
    await needAdmin(req);
    if (b.kind === 'invoice') await q('DELETE FROM invoices WHERE id=$1', [Number(b.id)]);
    else if (b.kind === 'project') await q('DELETE FROM projects WHERE id=$1', [Number(b.id)]);
    else throw bad('kind'); return { ok: true };
  }
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!DB_URL || !SECRET) throw new HttpError(500, 'config', 'Servidor sem configuração (DATABASE_URL / SESSION_SECRET).');
    const path = new URL(req.url, 'http://x').pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
    const fn = routes[req.method + ' ' + path];
    if (!fn) throw new HttpError(404, 'not_found', 'Rota não encontrada.');
    if (req.method === 'POST' && !String(req.headers['content-type'] || '').includes('application/json')) throw bad('content_type');
    await init();
    const out = await fn(req, res, req.body && typeof req.body === 'object' ? req.body : {});
    res.status(200).json(out);
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    const s = e instanceof HttpError ? e.status : 500;
    res.status(s).json({ error: e instanceof HttpError ? e.code : 'server', message: e instanceof HttpError ? e.message : 'Erro interno. Tente de novo.' });
  }
};
