#!/usr/bin/env node
/*
 * Гамлет XXI века — сервер для игры в аудитории.
 * Node.js 18+, без внешних зависимостей.
 *   PORT=8080 node server.js
 * Отдаёт index.html и держит игровые комнаты в памяти.
 * Обновления уходят на проектор и телефоны через Server-Sent Events.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HL = require('./logic.js');

const PORT = +process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const INDEX = path.join(__dirname, 'index.html');
const ROOM_TTL_MS = 12 * 3600 * 1000;
const MAX_ROOMS = 200;
const MAX_PLAYERS = 80;

const rooms = new Map();
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const key = () => crypto.randomBytes(12).toString('hex');
function newCode() {
  for (let i = 0; i < 1000; i++) {
    let c = '';
    for (let j = 0; j < 4; j++) c += CODE_ABC[crypto.randomInt(CODE_ABC.length)];
    if (!rooms.has(c)) return c;
  }
  throw new Error('no codes');
}
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);

/* ---------- комната ---------- */
function createRoom(o) {
  if (rooms.size >= MAX_ROOMS) throw new Error('Сервер занят: слишком много комнат');
  const mode = o.mode === 'teams' ? 'teams' : 'solo';
  const caseId = [1, 2, 3, 4, 5].includes(+o.caseId) ? +o.caseId : 1 + HL.rnd(5);
  const threshold = [8, 9, 10, 12].includes(+o.threshold) ? +o.threshold : 10;
  const room = {
    code: newCode(), hostKey: key(), mode, cfg: { caseId, threshold },
    phase: 'lobby', round: 0, roll: null, cards: HL.roundCards(caseId), timerEnd: null,
    units: {}, order: [], players: {}, clients: new Set(), touched: Date.now(), pending: false,
  };
  if (mode === 'teams') {
    const n = Math.min(4, Math.max(2, +o.teams || 2));
    for (let i = 0; i < n; i++) {
      const uid = 't' + i;
      const nm = clean((o.names || [])[i], 18) || HL.TEAMDEF[i][0];
      room.units[uid] = Object.assign(HL.makeUnit(nm, HL.TEAMDEF[i][1]), { captain: null });
      room.order.push(uid);
    }
  }
  rooms.set(room.code, room);
  return room;
}
const ctxOf = r => ({ caseId: r.cfg.caseId, threshold: r.cfg.threshold });
const PALETTE = ['#e2574c', '#4f86c6', '#4f9d63', '#e2b33c', '#9b6bd3', '#e07b39', '#3fa7a0', '#c4569a', '#6f8a3a', '#5a6fd6'];

function join(room, name, team) {
  if (Object.keys(room.players).length >= MAX_PLAYERS) throw new Error('В комнате нет мест');
  let nm = clean(name, 20) || 'Игрок';
  const taken = new Set(Object.values(room.players).map(p => p.name));
  let base = nm, k = 2; while (taken.has(nm)) nm = base + ' ' + (k++);
  const pid = 'p' + crypto.randomBytes(5).toString('hex');
  const p = { pid, key: key(), name: nm, uid: null };
  if (room.mode === 'solo') {
    p.uid = pid;
    const u = HL.makeUnit(nm, PALETTE[room.order.length % PALETTE.length]);
    room.units[pid] = u; room.order.push(pid);
    if (room.phase === 'play') HL.beginTurn(u, room.round, room.roll, room.cards[room.round - 1]);
    if (room.phase === 'reveal' || room.phase === 'closure') { /* догонит со следующего раунда */ }
  } else {
    const uid = room.units[team] ? team : room.order[0];
    p.uid = uid;
    if (!room.units[uid].captain) room.units[uid].captain = pid;
  }
  room.players[pid] = p;
  return p;
}

function startRound(room) {
  room.round++;
  room.roll = 1 + HL.rnd(6);
  room.phase = 'play';
  room.timerEnd = null;
  const cardId = room.cards[room.round - 1];
  for (const uid of room.order) {
    const u = room.units[uid];
    if (!u.out) HL.beginTurn(u, room.round, room.roll, cardId); else u.turn = null;
  }
}
function reveal(room) {
  for (const uid of room.order) { const u = room.units[uid]; if (!u.out && u.turn) HL.skipTurn(u); }
  room.phase = 'reveal'; room.timerEnd = null;
}
function hostAction(room, type, v) {
  switch (type) {
    case 'start': if (room.phase !== 'lobby') return; startRound(room); break;
    case 'reveal': if (room.phase !== 'play') return; reveal(room); break;
    case 'next':
      if (room.phase !== 'reveal') return;
      if (room.round >= 5 || room.order.every(uid => room.units[uid].out)) { room.phase = 'closure'; room.timerEnd = null; }
      else startRound(room);
      break;
    case 'final': if (room.phase !== 'closure') return; room.phase = 'final'; break;
    case 'timer': { const s = Math.min(600, Math.max(0, +v || 0)); room.timerEnd = s ? Date.now() + s * 1000 : null; break; }
    case 'rename': { if (room.mode !== 'teams') return; const u = room.units[v && v.uid]; if (u) u.name = clean(v.name, 18) || u.name; break; }
    default: return;
  }
}
function playerAction(room, p, type, v) {
  const u = room.units[p.uid]; if (!u) return;
  if (type === 'captain') { if (room.mode === 'teams') u.captain = p.pid; return; }
  if (room.mode === 'teams' && u.captain !== p.pid) return;
  if (type === 'closure') {
    if (room.phase !== 'closure' || u.out || (u.closure && u.closure.done)) return;
    const org = +v.org, goal = +v.goal;
    if (!(org >= 0 && org < HL.ORGS.length && goal >= 0 && goal < HL.GOALS.length)) return;
    u.closure = { org, goal, done: true }; return;
  }
  if (room.phase !== 'play') return;
  HL.act(u, type, v, ctxOf(room));
}

/* ---------- представления ---------- */
function unitSummary(room, uid) {
  const u = room.units[uid], t = u.turn;
  const members = Object.values(room.players).filter(p => p.uid === uid).map(p => p.name);
  return {
    uid, name: u.name, color: u.color, pts: u.pts, rep: u.rep, conc: u.conc, clues: u.clues, out: u.out,
    zone: t ? t.zone : 0, done: !!(t && t.result),
    verdict: room.phase !== 'play' && t && t.result ? t.verdict : null,
    mode: room.phase !== 'play' && t && t.result ? t.mode : null,
    dp: room.phase !== 'play' && t && t.result ? t.result.dp : null, dr: room.phase !== 'play' && t && t.result ? t.result.dr : null,
    closureDone: !!(u.closure && u.closure.done),
    solved: room.phase === 'final' ? HL.solved(u, ctxOf(room)) : null,
    won: room.phase === 'final' ? HL.won(u, ctxOf(room)) : null,
    stats: room.phase === 'final' ? HL.unitStats(u) : null,
    dist: room.phase === 'final' ? u.dist : null,
    members,
  };
}
function baseView(room) {
  return { code: room.code, mode: room.mode, phase: room.phase, round: room.round, roll: room.roll, cfg: room.cfg,
    cardId: room.round ? room.cards[room.round - 1] : null, timerEnd: room.timerEnd, now: Date.now(),
    teams: room.mode === 'teams' ? room.order.map(uid => ({ uid, name: room.units[uid].name, color: room.units[uid].color })) : null };
}
function hostView(room) {
  return Object.assign(baseView(room), { role: 'host', players: Object.keys(room.players).length, units: room.order.map(uid => unitSummary(room, uid)) });
}
function playerView(room, p) {
  const u = room.units[p.uid];
  const { deck, ...pub } = u;
  return Object.assign(baseView(room), {
    role: 'player', me: { pid: p.pid, name: p.name, uid: p.uid, captain: room.mode === 'solo' || u.captain === p.pid },
    unit: pub, captainName: room.mode === 'teams' && u.captain && room.players[u.captain] ? room.players[u.captain].name : null,
    members: Object.values(room.players).filter(x => x.uid === p.uid).map(x => x.name),
    standings: room.phase === 'final' || room.phase === 'reveal' ? room.order.map(uid => ({ name: room.units[uid].name, pts: room.units[uid].pts, color: room.units[uid].color })).sort((a, b) => b.pts - a.pts).slice(0, 10) : null,
    won: room.phase === 'final' ? HL.won(u, ctxOf(room)) : null, solved: room.phase === 'final' ? HL.solved(u, ctxOf(room)) : null,
  });
}
function send(c, obj) { try { c.res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch (e) { /* закрыт */ } }
function broadcast(room) {
  room.touched = Date.now();
  if (room.pending) return;
  room.pending = true;
  setTimeout(() => {
    room.pending = false;
    for (const c of room.clients) {
      if (c.role === 'host') send(c, hostView(room));
      else { const p = room.players[c.pid]; if (p) send(c, playerView(room, p)); }
    }
  }, 40);
}

/* ---------- HTTP ---------- */
function readJSON(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', d => { b += d; if (b.length > 20000) { reject(new Error('too big')); req.destroy(); } });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); } });
  });
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
const SEC_HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, Object.assign({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }, SEC_HEADERS));
      fs.createReadStream(INDEX).pipe(res); return;
    }
    if (url.pathname === '/api/ping') return json(res, 200, { ok: true, version: 1 });
    if (req.method === 'GET' && url.pathname === '/api/room') {
      const room = rooms.get(String(url.searchParams.get('code') || '').toUpperCase());
      if (!room) return json(res, 404, { error: 'Комната не найдена. Проверьте код на экране.' });
      return json(res, 200, { code: room.code, mode: room.mode, phase: room.phase,
        teams: room.mode === 'teams' ? room.order.map(uid => ({ uid, name: room.units[uid].name, color: room.units[uid].color, members: Object.values(room.players).filter(p => p.uid === uid).length })) : null });
    }
    if (req.method === 'POST' && url.pathname === '/api/create') {
      const b = await readJSON(req); const room = createRoom(b);
      return json(res, 200, { code: room.code, key: room.hostKey });
    }
    if (req.method === 'POST' && url.pathname === '/api/join') {
      const b = await readJSON(req); const room = rooms.get(clean(b.room, 4).toUpperCase());
      if (!room) return json(res, 404, { error: 'Комната не найдена. Проверьте код на экране.' });
      if (room.phase === 'final') return json(res, 409, { error: 'Игра уже закончилась.' });
      const p = join(room, b.name, b.team); broadcast(room);
      return json(res, 200, { pid: p.pid, key: p.key, name: p.name });
    }
    if (req.method === 'GET' && url.pathname === '/api/stream') {
      const room = rooms.get(String(url.searchParams.get('room') || '').toUpperCase());
      const role = url.searchParams.get('role'), k = url.searchParams.get('key'), pid = url.searchParams.get('pid');
      if (!room) return json(res, 404, { error: 'room' });
      if (role === 'host' ? k !== room.hostKey : !(room.players[pid] && room.players[pid].key === k)) return json(res, 403, { error: 'key' });
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 2000\n\n');
      const c = { res, role: role === 'host' ? 'host' : 'player', pid };
      room.clients.add(c);
      send(c, c.role === 'host' ? hostView(room) : playerView(room, room.players[pid]));
      const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch (e) { } }, 20000);
      req.on('close', () => { clearInterval(ka); room.clients.delete(c); });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/act') {
      const b = await readJSON(req); const room = rooms.get(String(b.room || '').toUpperCase());
      if (!room) return json(res, 404, { error: 'room' });
      if (b.role === 'host') {
        if (b.key !== room.hostKey) return json(res, 403, { error: 'key' });
        hostAction(room, String(b.type), b.v);
      } else {
        const p = room.players[b.pid]; if (!p || p.key !== b.key) return json(res, 403, { error: 'key' });
        playerAction(room, p, String(b.type), b.v);
      }
      broadcast(room); return json(res, 200, { ok: true });
    }
    res.writeHead(404, SEC_HEADERS); res.end('Not found');
  } catch (e) {
    json(res, 400, { error: String(e.message || e) });
  }
});
setInterval(() => {
  const now = Date.now();
  for (const [code, r] of rooms) if (now - r.touched > ROOM_TTL_MS && !r.clients.size) rooms.delete(code);
}, 600000).unref();
server.listen(PORT, HOST, () => console.log('Гамлет XXI века: http://localhost:' + PORT));
