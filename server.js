'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'social.json');
const HTML_FILE = path.join(__dirname, 'index.html');

fs.mkdirSync(DATA_DIR, { recursive: true });
function loadDB() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { players: db.players && typeof db.players === 'object' ? db.players : {}, requests: Array.isArray(db.requests) ? db.requests : [], friends: Array.isArray(db.friends) ? db.friends : [] };
  } catch { return { players: {}, requests: [], friends: [] }; }
}
let db = loadDB();
function saveDB() {
  const temp = DB_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(temp, DB_FILE);
}
const send = (res, status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(obj)); };
const cleanName = v => String(v || 'Tripulante').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 20) || 'Tripulante';
const validTag = v => typeof v === 'string' && /^AB-[A-Z0-9]{4}-[A-Z0-9]{3}$/.test(v);
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''; req.on('data', chunk => { data += chunk; if (data.length > 16_384) { reject(new Error('Solicitud demasiado grande')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('JSON no válido')); } }); req.on('error', reject);
  });
}
function player(tag) { return db.players[tag] || null; }
function areFriends(a,b) { return db.friends.some(f => (f.a===a && f.b===b) || (f.a===b && f.b===a)); }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, service: 'Intruso a bordo', version: 1 });
  if (req.method === 'GET' && url.pathname === '/') {
    try { const html = fs.readFileSync(HTML_FILE); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }); return res.end(html); }
    catch { return send(res, 500, { error: 'No se pudo cargar index.html' }); }
  }
  if (!url.pathname.startsWith('/api/')) return send(res, 404, { error: 'Ruta no encontrada' });
  try {
    if (req.method === 'POST' && url.pathname === '/api/profile') {
      const b = await readBody(req); const tag = String(b.tag || '').toUpperCase();
      if (!validTag(tag)) return send(res, 400, { error: 'Tag de jugador no válido' });
      db.players[tag] = { tag, name: cleanName(b.name), updatedAt: Date.now() }; saveDB();
      return send(res, 200, { player: db.players[tag] });
    }
    if (req.method === 'GET' && url.pathname === '/api/friends') {
      const tag = String(url.searchParams.get('tag') || '').toUpperCase();
      if (!validTag(tag) || !player(tag)) return send(res, 404, { error: 'Cuenta no registrada en el servidor' });
      const incoming = db.requests.filter(r => r.toTag === tag && r.status === 'pending').map(r => ({ ...r, tag: r.fromTag, name: player(r.fromTag)?.name || r.fromName || 'Tripulante' }));
      const outgoing = db.requests.filter(r => r.fromTag === tag && r.status === 'pending').map(r => ({ ...r, tag: r.toTag, name: player(r.toTag)?.name || 'Tripulante' }));
      const friends = db.friends.filter(f => f.a === tag || f.b === tag).map(f => { const other = f.a === tag ? f.b : f.a; return { tag: other, name: player(other)?.name || 'Tripulante' }; });
      return send(res, 200, { incoming, outgoing, friends });
    }
    if (req.method === 'POST' && url.pathname === '/api/friends/request') {
      const b = await readBody(req); const fromTag = String(b.fromTag || '').toUpperCase(); const toTag = String(b.toTag || '').toUpperCase();
      if (!validTag(fromTag) || !validTag(toTag)) return send(res, 400, { error: 'Tag de jugador no válido' });
      if (fromTag === toTag) return send(res, 400, { error: 'No puedes enviarte una solicitud a ti mismo' });
      if (!player(fromTag)) return send(res, 401, { error: 'Abre tu perfil una vez para registrar tu cuenta en el servidor' });
      if (!player(toTag)) return send(res, 404, { error: 'Esa cuenta no existe en el servidor' });
      if (areFriends(fromTag, toTag)) return send(res, 409, { error: 'Ya sois amigos' });
      const existing = db.requests.find(r => r.status === 'pending' && ((r.fromTag === fromTag && r.toTag === toTag) || (r.fromTag === toTag && r.toTag === fromTag)));
      if (existing) return send(res, 409, { error: existing.fromTag === fromTag ? 'Ya tienes una solicitud pendiente' : 'Esa persona ya te ha enviado una solicitud; puedes aceptarla' });
      const request = { id: crypto.randomUUID(), fromTag, toTag, fromName: cleanName(b.fromName || player(fromTag).name), status: 'pending', createdAt: Date.now() };
      db.requests.push(request); saveDB(); return send(res, 201, { request });
    }
    if (req.method === 'POST' && url.pathname === '/api/friends/respond') {
      const b = await readBody(req); const tag = String(b.tag || '').toUpperCase(); const reqId = String(b.requestId || ''); const action = b.action;
      const r = db.requests.find(x => x.id === reqId && x.toTag === tag && x.status === 'pending');
      if (!r) return send(res, 404, { error: 'La solicitud ya no existe o ya fue atendida' });
      if (action === 'accept') {
        if (!areFriends(r.fromTag, r.toTag)) db.friends.push({ a: r.fromTag, b: r.toTag, createdAt: Date.now() });
        r.status = 'accepted'; r.respondedAt = Date.now();
        // Mark any opposite pending request resolved too.
        db.requests.forEach(x => { if (x.id !== r.id && x.status === 'pending' && x.fromTag === r.toTag && x.toTag === r.fromTag) x.status = 'accepted'; });
      } else if (action === 'reject') { r.status = 'rejected'; r.respondedAt = Date.now(); }
      else return send(res, 400, { error: 'Acción no válida' });
      saveDB(); return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/friends/remove') {
      const b = await readBody(req); const tag = String(b.tag || '').toUpperCase(); const friendTag = String(b.friendTag || '').toUpperCase();
      const before = db.friends.length; db.friends = db.friends.filter(f => !((f.a === tag && f.b === friendTag) || (f.a === friendTag && f.b === tag)));
      if (db.friends.length === before) return send(res, 404, { error: 'Amistad no encontrada' });
      saveDB(); return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'Ruta no encontrada' });
  } catch (err) { console.error(err); return send(res, 500, { error: 'Error interno del servidor. Inténtalo de nuevo.' }); }
});
server.listen(PORT, HOST, () => console.log(`Intruso a bordo listo en http://localhost:${PORT}`));
