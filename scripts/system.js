#!/usr/bin/env node
/**
 * L-ERP — Local System Manager (run / restart / kill / clean / status)
 *
 * Quản trị toàn bộ hệ thống ở local: hạ tầng Docker + 13 apps.
 * Toàn bộ HTTP app listener dùng dải port 3010+.
 *
 * Usage:
 *   node scripts/system.js run [apps...]      # start infra + apps (mặc định: tất cả)
 *   node scripts/system.js run --infra-only   # chỉ start Docker infra
 *   node scripts/system.js run --no-infra     # chỉ start apps, bỏ qua Docker
 *   node scripts/system.js restart [apps...]  # kill apps → start lại (giữ infra)
 *   node scripts/system.js kill [apps...]     # dừng apps (--all: kèm Docker down)
 *   node scripts/system.js clean [--keep-deps] [--volumes]
 *                                             # dừng hết + xoá build artifacts
 *                                             #   --keep-deps   giữ node_modules
 *                                             #   --volumes     xoá cả DB volume
 *   node scripts/system.js status             # bảng trạng thái
 *
 * Alias app: mrp, hrm, crm, acc, pm, tpm (api), tpmweb, xai/excel, eco, otb,
 *            docs, landing, liphoco
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RUN_DIR = path.join(ROOT, '.run');
const LOG_DIR = path.join(ROOT, 'logs');

// ─── Port map — SINGLE SOURCE OF TRUTH (dải 3010+) ───────────────────────────
const APPS = {
  'TPM-api-nestjs': { port: 3010, dir: 'apps/TPM-api-nestjs', cmd: 'start:dev', desc: 'TPM Backend (NestJS)' },
  'HRM-unified':    { port: 3011, dir: 'apps/HRM-unified',    cmd: 'dev',       desc: 'HRM hợp nhất' },
  'Accounting':     { port: 3012, dir: 'apps/Accounting',     cmd: 'dev',       desc: 'Kế toán TT200' },
  'CRM':            { port: 3013, dir: 'apps/CRM',            cmd: 'dev',       desc: 'CRM' },
  'Ecommerce':      { port: 3014, dir: 'apps/Ecommerce',      cmd: 'dev',       desc: 'Thương mại điện tử' },
  'MRP':            { port: 3015, dir: 'apps/MRP',            cmd: 'dev',       desc: 'Sản xuất' },
  'OTB':            { port: 3016, dir: 'apps/OTB',            cmd: 'dev',       desc: 'Open-To-Buy' },
  'PM':             { port: 3017, dir: 'apps/PM',             cmd: 'dev',       desc: 'Quản lý dự án' },
  'ExcelAI':        { port: 3018, dir: 'apps/ExcelAI',        cmd: 'dev',       desc: 'Excel AI' },
  'TPM-web':        { port: 3019, dir: 'apps/TPM-web',        cmd: 'dev',       desc: 'TPM Frontend' },
  'docs':           { port: 3020, dir: 'apps/docs',           cmd: 'dev',       desc: 'Docs portal' },
  'landing-page':   { port: 3021, dir: 'apps/landing-page',   cmd: 'dev',       desc: 'Landing page' },
  'liphoco':        { port: 3022, dir: 'apps/liphoco',        cmd: 'dev',       desc: 'Liphoco ERP' },
};

const ALIASES = {
  tpm: 'TPM-api-nestjs', 'tpm-api': 'TPM-api-nestjs', tpmapi: 'TPM-api-nestjs',
  tpmweb: 'TPM-web', 'tpm-web': 'TPM-web', web: 'TPM-web',
  hrm: 'HRM-unified', hrmunified: 'HRM-unified',
  acc: 'Accounting', accounting: 'Accounting',
  crm: 'CRM',
  eco: 'Ecommerce', ecommerce: 'Ecommerce', 'e-commerce': 'Ecommerce',
  mrp: 'MRP',
  otb: 'OTB',
  pm: 'PM', project: 'PM',
  xai: 'ExcelAI', excel: 'ExcelAI', excelai: 'ExcelAI',
  docs: 'docs', doc: 'docs',
  landing: 'landing-page', landingpage: 'landing-page',
  liphoco: 'liphoco',
};

// ─── Utils ────────────────────────────────────────────────────────────────────
const isWin = process.platform === 'win32';
const npmBin = isWin ? 'npm.cmd' : 'npm';

function log(msg) { console.log(msg); }
function ok(msg)  { console.log(`  ✅ ${msg}`); }
function warn(msg){ console.log(`  ⚠️  ${msg}`); }
function err(msg) { console.error(`  ❌ ${msg}`); }

function resolveApp(name) {
  const key = ALIASES[name] || name;
  // case-insensitive match với tên thật
  const found = Object.keys(APPS).find(k => k.toLowerCase() === key.toLowerCase());
  return found || null;
}

function pidFile(app) { return path.join(RUN_DIR, `${app}.pid`); }
function logFile(app) { return path.join(LOG_DIR, `${app}.log`); }

function readPid(app) {
  try { return parseInt(fs.readFileSync(pidFile(app), 'utf8').trim(), 10); } catch { return null; }
}
function writePid(app, pid) {
  fs.mkdirSync(RUN_DIR, { recursive: true });
  fs.writeFileSync(pidFile(app), String(pid));
}
function clearPid(app) { try { fs.rmSync(pidFile(app)); } catch {} }

function isPidAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

/** PID đang lắng nghe port (macOS/Linux: lsof; Windows: netstat). */
function portPids(port) {
  if (isWin) {
    const r = spawnSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' });
    if (r.status !== 0) return [];
    const pids = new Set();
    for (const line of r.stdout.split('\n')) {
      if (line.includes(`:${port} `) && line.trim().endsWith('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        pids.add(parseInt(parts[parts.length - 1], 10));
      }
    }
    return [...pids];
  }
  const r = spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout.trim()) return [];
  return [...new Set(r.stdout.trim().split('\n').map(Number).filter(Boolean))];
}

function killPid(pid, signal = 'SIGTERM') {
  try { process.kill(pid, signal); return true; } catch { return false; }
}

// ─── Infra (Docker) ───────────────────────────────────────────────────────────
function dockerAvailable() {
  return spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0;
}

function infraUp() {
  if (!dockerAvailable()) {
    warn('Docker không chạy — bỏ qua hạ tầng (apps vẫn start nếu không cần DB).');
    return false;
  }
  log('\n🐳 Hạ tầng Docker (postgres, redis, nats, keycloak, kong)...');
  const r = spawnSync('docker', ['compose', 'up', '-d'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status === 0) ok('Hạ tầng đã start (127.0.0.1: 5432 pg · 6379 redis · 4222 nats · 8080 keycloak · 8000 kong)');
  else err('docker compose up thất bại');
  return r.status === 0;
}

function infraDown(withVolumes = false) {
  if (!dockerAvailable()) { warn('Docker không chạy.'); return; }
  const args = ['compose', 'down', ...(withVolumes ? ['-v'] : [])];
  const r = spawnSync('docker', args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status === 0) ok(`Hạ tầng đã dừng${withVolumes ? ' (+volumes đã xoá — MẤT DỮ LIỆU DB)' : ''}`);
}

function infraStatus() {
  if (!dockerAvailable()) { warn('Docker không chạy'); return; }
  spawnSync('docker', ['compose', 'ps'], { cwd: ROOT, stdio: 'inherit' });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
function startApp(app) {
  const conf = APPS[app];
  const cwd = path.join(ROOT, conf.dir);

  if (!fs.existsSync(path.join(cwd, 'package.json'))) { err(`Không tìm thấy ${conf.dir}/package.json`); return false; }

  // Đã chạy?
  const live = portPids(conf.port);
  if (live.length > 0) { warn(`${app} đã chạy ở :${conf.port} (pid ${live.join(',')}) — bỏ qua`); return true; }

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const fd = fs.openSync(logFile(app), 'a');
  fs.writeSync(fd, `\n═══ ${new Date().toISOString()} — start ${app} ═══\n`);

  const child = spawn(npmBin, ['run', conf.cmd], {
    cwd, detached: true, stdio: ['ignore', fd, fd],
    env: { ...process.env, PORT: String(conf.port) },
  });
  child.unref();
  fs.closeSync(fd);

  if (child.pid) {
    writePid(app, child.pid);
    ok(`${app.padEnd(16)} → http://localhost:${conf.port}  (log: logs/${app}.log)`);
    return true;
  }
  err(`Không spawn được ${app}`);
  return false;
}

function stopApp(app) {
  const conf = APPS[app];
  let killed = 0;

  // 1) PID từ file
  const pid = readPid(app);
  if (isPidAlive(pid)) { killPid(pid); killed++; }
  clearPid(app);

  // 2) PID đang giữ port (bảo hiểm cho process ngoài quản lý)
  const live = portPids(conf.port);
  for (const p of live) { if (killPid(p)) killed++; }

  if (killed) ok(`${app} đã dừng (${killed} process)`);
  else log(`  · ${app}: không chạy`);
}

// ─── Commands ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const flags = { infraOnly: false, noInfra: false, all: false, keepDeps: false, volumes: false };
  const names = [];
  for (const a of argv) {
    if (a === '--infra-only') flags.infraOnly = true;
    else if (a === '--no-infra') flags.noInfra = true;
    else if (a === '--all') flags.all = true;
    else if (a === '--keep-deps') flags.keepDeps = true;
    else if (a === '--volumes' || a === '-v') flags.volumes = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else names.push(a);
  }
  const apps = names.map(resolveApp);
  const invalid = names.filter((n, i) => !apps[i]);
  if (invalid.length) {
    err(`App không rõ: ${invalid.join(', ')}. Danh sách: ${Object.keys(APPS).join(', ')}`);
    process.exit(1);
  }
  return { flags, apps: apps.filter(Boolean) };
}

function cmdRun(argv) {
  const { flags, apps } = parseArgs(argv);
  const list = apps.length ? apps : Object.keys(APPS);

  log(`\n🚀 L-ERP — start ${apps.length ? apps.join(', ') : 'TOÀN BỘ hệ thống'}`);

  let infraStarted = false;
  if (!flags.noInfra && !flags.infraOnly) infraStarted = infraUp();
  else if (flags.infraOnly) { infraUp(); return; }

  if (!infraStarted && !flags.noInfra) warn('Tiếp tục start apps không có hạ tầng...');

  log('');
  for (const app of list) startApp(app);
  log('\n👉 Xem log realtime: tail -f logs/<app>.log · Trạng thái: npm run sys:status');
}

function cmdKill(argv) {
  const { flags, apps } = parseArgs(argv);
  const list = apps.length ? apps : Object.keys(APPS);

  log(`\n🛑 Dừng ${apps.length ? apps.join(', ') : 'tất cả apps'}...`);
  for (const app of list) stopApp(app);

  if (flags.all) {
    log('\n🐳 Dừng hạ tầng Docker...');
    infraDown(false);
  }
  log('');
}

function cmdRestart(argv) {
  const { apps } = parseArgs(argv);
  const list = apps.length ? apps : Object.keys(APPS);
  log(`\n🔄 Restart ${list.join(', ')}`);
  for (const app of list) stopApp(app);
  // đợi port nhả
  const deadline = Date.now() + 4000;
  for (const app of list) {
    const conf = APPS[app];
    while (Date.now() < deadline && portPids(conf.port).length) {
      spawnSync('sleep', ['0.2']);
    }
  }
  cmdRun(argv);
}

function cmdClean(argv) {
  const { flags } = parseArgs(argv);
  log('\n🧹 CLEAN toàn bộ hệ thống');
  cmdKill(['--all']);
  log('\n📁 Xoá build artifacts...');
  const patterns = ['.run', 'logs', '.turbo'];
  const perApp = ['.next', 'dist', '.cache', 'coverage', 'out', 'build'];
  const perPkg = ['dist', '.turbo'];

  let removed = 0;
  for (const p of patterns) {
    const full = path.join(ROOT, p);
    if (fs.existsSync(full)) { fs.rmSync(full, { recursive: true, force: true }); log(`  ✅ ${p}`); removed++; }
  }
  for (const base of ['apps', 'packages']) {
    const baseDir = path.join(ROOT, base);
    if (!fs.existsSync(baseDir)) continue;
    for (const entry of fs.readdirSync(baseDir)) {
      const entryPath = path.join(baseDir, entry);
      if (!fs.statSync(entryPath).isDirectory()) continue;
      const targets = base === 'apps' ? [...perApp, ...(flags.keepDeps ? [] : ['node_modules'])]
                                      : [...perPkg, ...(flags.keepDeps ? [] : ['node_modules'])];
      for (const t of targets) {
        const full = path.join(entryPath, t);
        if (fs.existsSync(full)) { fs.rmSync(full, { recursive: true, force: true }); log(`  ✅ ${base}/${entry}/${t}`); removed++; }
      }
    }
  }
  if (!flags.keepDeps) {
    const rootNm = path.join(ROOT, 'node_modules');
    if (fs.existsSync(rootNm)) { fs.rmSync(rootNm, { recursive: true, force: true }); log('  ✅ node_modules (root)'); removed++; }
  }
  log(`\nĐã xoá ${removed} mục. Chạy lại: npm install && npm run sys:run`);
}

function cmdStatus() {
  log('\n📊 L-ERP — TRẠNG THÁI HỆ THỐNG');
  log('┌──────────────────┬──────┬─────────┬────────────────────────────┐');
  log('│ App              │ Port │ PID     │ URL                       │');
  log('├──────────────────┼──────┼─────────┼────────────────────────────┤');
  for (const [app, conf] of Object.entries(APPS)) {
    const pids = portPids(conf.port);
    const pid = pids.length ? pids.join(',') : '—';
    const url = `http://localhost:${conf.port}`;
    const mark = pids.length ? '🟢' : '⚪';
    log(`│ ${mark} ${app.padEnd(15)}│ ${String(conf.port).padEnd(4)} │ ${pid.padEnd(7)}│ ${url.padEnd(26)}│`);
  }
  log('└──────────────────┴──────┴─────────┴────────────────────────────┘');
  log('\n🐳 Docker:');
  infraStatus();
}

function help() {
  console.log(`
L-ERP System Manager — quản trị local (dải port 3010+)

  npm run sys:run [apps...]     Start infra Docker + apps (mặc định tất cả)
  npm run sys:run -- --infra-only   Chỉ start hạ tầng Docker
  npm run sys:run -- --no-infra     Chỉ start apps
  npm run sys:restart [apps...]  Dừng rồi start lại
  npm run sys:kill [-- --all]    Dừng apps (+ hạ tầng nếu --all)
  npm run sys:clean              Dừng hết + xoá build artifacts + node_modules
  npm run sys:status             Bảng trạng thái port/PID + Docker

Apps: ${Object.keys(APPS).join(', ')}
Alias: ${Object.entries(ALIASES).map(([k, v]) => `${k}→${v}`).join(', ')}
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case 'run':     cmdRun(rest); break;
  case 'restart': cmdRestart(rest); break;
  case 'kill':    cmdKill(rest); break;
  case 'clean':   cmdClean(rest); break;
  case 'status':  cmdStatus(); break;
  case 'help': case '--help': case undefined: help(); break;
  default: err(`Lệnh không rõ: ${cmd}`); help(); process.exit(1);
}
