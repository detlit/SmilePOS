const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, screen } = require('electron');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');
const os = require('os');

let storeCache = null;

function getStorePath() {
  return path.join(app.getPath('userData'), 'launcher-store.json');
}

function readStore() {
  if (storeCache) return storeCache;

  try {
    storeCache = JSON.parse(fs.readFileSync(getStorePath(), 'utf8'));
  } catch {
    storeCache = {};
  }

  return storeCache;
}

function writeStore(data) {
  storeCache = data;
  fs.mkdirSync(path.dirname(getStorePath()), { recursive: true });
  fs.writeFileSync(getStorePath(), JSON.stringify(data, null, 2), 'utf8');
}

const store = {
  get(key) {
    return readStore()[key];
  },
  set(key, value) {
    const data = { ...readStore(), [key]: value };
    writeStore(data);
  },
  delete(key) {
    const data = { ...readStore() };
    delete data[key];
    writeStore(data);
  },
};

function readPortFromEnvUrl() {
  try {
    return process.env.ELECTRON_APP_URL ? new URL(process.env.ELECTRON_APP_URL).port : '';
  } catch {
    return '';
  }
}

const DEFAULT_APP_PORT = Number(process.env.ELECTRON_APP_PORT || process.env.PORT || readPortFromEnvUrl() || 4000);
const DEFAULT_APP_HOST = process.env.ELECTRON_APP_HOST || 'localhost';
const CONNECT_TIMEOUT_MS = Number(process.env.ELECTRON_CONNECT_TIMEOUT_MS || 12000);
const LOCAL_SERVER_TIMEOUT_MS = Number(process.env.ELECTRON_LOCAL_SERVER_TIMEOUT_MS || 45000);
const CONNECT_PROBE_PATH = process.env.ELECTRON_CONNECT_PROBE_PATH || '/api/health';
const LAN_BRIDGE_HOST = process.env.ELECTRON_LAN_BRIDGE_HOST || '0.0.0.0';
const LAN_BRIDGE_PORT = Number(process.env.ELECTRON_LAN_BRIDGE_PORT || process.env.ELECTRON_CLIENT_PORT || (DEFAULT_APP_PORT + 1));
const PRINT_TIMEOUT_MS = Number(process.env.ELECTRON_PRINT_TIMEOUT_MS || 25000);
const PRINT_ASSET_TIMEOUT_MS = Number(process.env.ELECTRON_PRINT_ASSET_TIMEOUT_MS || 6000);
const RENDERER_RECOVERY_DELAY_MS = Number(process.env.ELECTRON_RENDERER_RECOVERY_DELAY_MS || 8000);
const HEALTH_CHECK_INTERVAL_MS = Number(process.env.ELECTRON_HEALTH_CHECK_INTERVAL_MS || 300000);

app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('enable-features', 'CSSColorSchemeUARendering');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let mainWindow;
let customerWindow = null;
let tray = null;
let localServerProcess = null;
// B4: ล็อกหน้าชำระเงิน — เมื่อ true จะบล็อกการปิดหน้าต่าง/รีเฟรช/Ctrl+W/Ctrl+R (กันทุจริต)
// เซ็ตค่าจาก renderer ผ่าน IPC 'set-pay-lock' | isQuitting = safety valve ให้ปิดโปรแกรมจริงได้เสมอ
let payLocked = false;
let isQuitting = false;
let localServerLog = [];
let lanBridgeServer = null;
let lanBridgePort = null;
let lanBridgeUpstreamUrl = null;
let unresponsiveReloadTimer = null;
let healthCheckTimer = null;
let printQueue = Promise.resolve();
let printJobCount = 0;
// Print agent: ต่อค้างไว้กับ /api/print/stream เพื่อรับงานพิมพ์จากแท็บเล็ต Android
let printAgentRequest = null;
let printAgentRetryTimer = null;
let printAgentBaseUrl = null;
let printAgentStopped = true;

function getLocalAppUrl() {
  if (process.env.ELECTRON_APP_URL) {
    return normalizeOrigin(process.env.ELECTRON_APP_URL);
  }

  return `http://${DEFAULT_APP_HOST}:${DEFAULT_APP_PORT}`;
}

function normalizeOrigin(value) {
  const url = new URL(value);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('รองรับเฉพาะ http หรือ https');
  }

  return url.origin;
}

function isPrivateIPv4(hostname) {
  const parts = String(hostname || '').split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
  );
}

function hasExplicitPort(raw) {
  return /^https?:\/\/[^/?#]+:\d+(?:[/?#]|$)/i.test(raw) || /^[^:/?#]+:\d+(?:[/?#]|$)/i.test(raw);
}

function getClientDefaultPort() {
  return lanBridgePort || LAN_BRIDGE_PORT;
}

function normalizeServerInput(input, options = {}) {
  const raw = String(input || '').trim();
  const defaultPort = Number(options.defaultPort || DEFAULT_APP_PORT);

  if (!raw) {
    throw new Error('กรุณากรอกที่อยู่ Server');
  }

  const hasProtocol = /^https?:\/\//i.test(raw);
  const url = new URL(hasProtocol ? raw : `http://${raw}`);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('รองรับเฉพาะ http หรือ https');
  }

  if (!url.port && (!hasProtocol || (url.protocol === 'http:' && isPrivateIPv4(url.hostname) && !hasExplicitPort(raw)))) {
    url.port = String(defaultPort);
  }

  return {
    input: raw,
    url: url.origin,
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'https:' ? 443 : 80)),
    protocol: url.protocol.replace(':', ''),
  };
}

function getSavedConnection() {
  const savedConnection = store.get('connection');

  if (savedConnection && savedConnection.url) {
    if (savedConnection.mode === 'server') {
      return {
        ...savedConnection,
        url: getLocalAppUrl(),
        host: DEFAULT_APP_HOST,
        port: DEFAULT_APP_PORT,
      };
    }

    return savedConnection;
  }

  const legacyIP = store.get('serverIP');
  if (!legacyIP) return null;

  if (legacyIP === 'localhost' || legacyIP === '127.0.0.1') {
    return {
      mode: 'server',
      host: DEFAULT_APP_HOST,
      port: DEFAULT_APP_PORT,
      url: getLocalAppUrl(),
      updatedAt: null,
    };
  }

  try {
    const target = normalizeServerInput(legacyIP, { defaultPort: getClientDefaultPort() });
    return {
      mode: 'client',
      host: target.host,
      port: target.port,
      url: target.url,
      updatedAt: null,
    };
  } catch {
    return null;
  }
}

function saveConnection(connection) {
  const nextConnection = {
    ...connection,
    updatedAt: new Date().toISOString(),
  };

  store.set('connection', nextConnection);
  store.set('serverIP', connection.mode === 'server' ? 'localhost' : connection.host);
}

function clearConnection() {
  store.delete('connection');
  store.delete('serverIP');
}

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      const family = typeof entry.family === 'string' ? entry.family : `IPv${entry.family}`;
      if (family === 'IPv4' && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }

  return addresses;
}

function getLanUrls(port = DEFAULT_APP_PORT) {
  return getLanAddresses().map((address) => `http://${address}:${port}`);
}

function getBridgeLanUrls() {
  return getLanUrls(getClientDefaultPort());
}

function getFirewallRuleName(port = DEFAULT_APP_PORT, purpose = 'Server') {
  return `SmilePharmacy POS ${purpose} (port ${port})`;
}

function getCommandOutput(result) {
  return [result.stdout, result.stderr]
    .filter(Boolean)
    .join('\n')
    .trim();
}

function runSync(file, args) {
  return spawnSync(file, args, {
    encoding: 'utf8',
    windowsHide: true,
  });
}

function psSingleQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function ensureWindowsFirewallRule(port = DEFAULT_APP_PORT, purpose = 'Server') {
  if (process.platform !== 'win32') {
    return { ok: true, skipped: true, reason: 'not-windows' };
  }

  const ruleName = getFirewallRuleName(port, purpose);
  const showArgs = ['advfirewall', 'firewall', 'show', 'rule', `name=${ruleName}`];
  const existing = runSync('netsh.exe', showArgs);

  if (existing.status === 0) {
    return { ok: true, alreadyExists: true, ruleName };
  }

  const addArgs = [
    'advfirewall',
    'firewall',
    'add',
    'rule',
    `name=${ruleName}`,
    'dir=in',
    'action=allow',
    'protocol=TCP',
    `localport=${port}`,
    'profile=any',
  ];
  const direct = runSync('netsh.exe', addArgs);

  if (direct.status === 0) {
    return { ok: true, created: true, ruleName };
  }

  const elevatedArgs = `advfirewall firewall add rule name="${ruleName}" dir=in action=allow protocol=TCP localport=${port} profile=any`;
  const elevated = runSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `Start-Process -FilePath netsh.exe -ArgumentList ${psSingleQuote(elevatedArgs)} -Verb RunAs -Wait`,
  ]);

  const verified = runSync('netsh.exe', showArgs);
  if (verified.status === 0) {
    return { ok: true, created: true, elevated: true, ruleName };
  }

  return {
    ok: false,
    ruleName,
    error: getCommandOutput(elevated) || getCommandOutput(direct) || 'ต้องอนุญาตสิทธิ์ Administrator เพื่อเปิด Firewall port',
  };
}

async function probeLanUrls(timeoutMs = 2500, port = DEFAULT_APP_PORT) {
  const urls = getLanUrls(port);
  const results = await Promise.all(urls.map(async (url) => ({
    url,
    ...(await probeUrl(url, timeoutMs)),
  })));

  return {
    ok: results.some((result) => result.ok),
    urls,
    reachable: results.filter((result) => result.ok).map((result) => result.url),
    results,
  };
}

function describeProbeFailure(result, targetUrl) {
  const url = targetUrl || result?.url || 'server';
  const error = String(result?.error || result?.code || '').trim();

  if (error.includes('ECONNREFUSED')) {
    return `${url} ปฏิเสธการเชื่อมต่อ - เครื่องหลักยังไม่ได้เปิด Server หรือ server ฟังเฉพาะ localhost`;
  }

  if (/timeout|timed out/i.test(error)) {
    return `${url} เชื่อมต่อหมดเวลา - ตรวจ IP, วง LAN, และ Firewall port ${DEFAULT_APP_PORT}`;
  }

  if (result?.statusCode) {
    return `${url} ตอบกลับ HTTP ${result.statusCode}`;
  }

  return error ? `${url}: ${error}` : `${url} เชื่อมต่อไม่ได้`;
}

async function prepareServerLanAccess(startup) {
  const bridge = await ensureLanBridge(getLocalAppUrl());
  const firewall = ensureWindowsFirewallRule(bridge.port, 'LAN Bridge');
  const probe = await probeLanUrls(2500, bridge.port);

  if (probe.urls.length > 0 && !probe.ok) {
    const targets = probe.urls.join(', ');
    const firewallNote = firewall.ok ? '' : ` เปิด Firewall ไม่สำเร็จ: ${firewall.error}`;

    if (startup?.external) {
      throw new Error(
        `เปิด LAN Bridge แล้ว แต่ยังเข้า LAN ไม่ได้ (${targets}).${firewallNote} ` +
        `ตรวจว่าเครื่องอยู่ Wi-Fi เดียวกันและไม่ได้ใช้ Guest Wi-Fi`
      );
    }

    if (!firewall.ok) {
      throw new Error(`เปิด Server แล้ว แต่เตรียม LAN Bridge ไม่สำเร็จ (${targets}).${firewallNote}`);
    }
  }

  if (!firewall.ok && probe.urls.length === 0) {
    throw new Error(`เปิด Firewall port ${bridge.port} ไม่สำเร็จ: ${firewall.error}`);
  }

  return { firewall, probe, bridge };
}

function buildProxyHeaders(headers, upstream) {
  return {
    ...headers,
    host: upstream.host,
    'x-forwarded-host': headers.host || upstream.host,
    'x-forwarded-proto': 'http',
    'x-forwarded-for': headers['x-forwarded-for'] || '',
  };
}

function proxyHttpRequest(clientRequest, clientResponse, upstreamOrigin) {
  let upstream;
  try {
    upstream = new URL(upstreamOrigin);
  } catch (error) {
    clientResponse.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    clientResponse.end(`Invalid upstream URL: ${error.message}`);
    return;
  }

  const transport = upstream.protocol === 'https:' ? https : http;
  const proxyRequest = transport.request({
    protocol: upstream.protocol,
    hostname: upstream.hostname,
    port: upstream.port || (upstream.protocol === 'https:' ? 443 : 80),
    method: clientRequest.method,
    path: clientRequest.url || '/',
    headers: buildProxyHeaders(clientRequest.headers, upstream),
  }, (proxyResponse) => {
    clientResponse.writeHead(proxyResponse.statusCode || 502, proxyResponse.statusMessage, proxyResponse.headers);
    proxyResponse.pipe(clientResponse);
  });

  proxyRequest.on('error', (error) => {
    if (!clientResponse.headersSent) {
      clientResponse.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    }
    clientResponse.end(`LAN Bridge proxy error: ${error.message}`);
  });

  clientRequest.on('aborted', () => {
    proxyRequest.destroy();
  });

  clientRequest.pipe(proxyRequest);
}

function proxyUpgradeRequest(request, socket, head, upstreamOrigin) {
  let upstream;
  try {
    upstream = new URL(upstreamOrigin);
  } catch {
    socket.destroy();
    return;
  }

  if (upstream.protocol !== 'http:') {
    socket.destroy();
    return;
  }

  const upstreamSocket = net.connect(Number(upstream.port || 80), upstream.hostname, () => {
    const headers = buildProxyHeaders(request.headers, upstream);
    upstreamSocket.write(`${request.method} ${request.url || '/'} HTTP/${request.httpVersion}\r\n`);

    for (const [name, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        value.forEach((item) => upstreamSocket.write(`${name}: ${item}\r\n`));
      } else if (value !== undefined) {
        upstreamSocket.write(`${name}: ${value}\r\n`);
      }
    }

    upstreamSocket.write('\r\n');
    if (head && head.length) upstreamSocket.write(head);
    socket.pipe(upstreamSocket).pipe(socket);
  });

  upstreamSocket.on('error', () => socket.destroy());
  socket.on('error', () => upstreamSocket.destroy());
}

function listenLanBridge(server, preferredPort) {
  return new Promise((resolve, reject) => {
    let nextPort = preferredPort;
    const lastPort = preferredPort + 20;

    const tryListen = () => {
      const onError = (error) => {
        server.off('listening', onListening);
        if (error.code === 'EADDRINUSE' && nextPort < lastPort) {
          nextPort += 1;
          tryListen();
          return;
        }

        reject(error);
      };

      const onListening = () => {
        server.off('error', onError);
        resolve(nextPort);
      };

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(nextPort, LAN_BRIDGE_HOST);
    };

    tryListen();
  });
}

async function stopLanBridge() {
  if (!lanBridgeServer) return;

  const server = lanBridgeServer;
  lanBridgeServer = null;
  lanBridgePort = null;
  lanBridgeUpstreamUrl = null;

  await new Promise((resolve) => {
    server.close(() => resolve());
  }).catch(() => undefined);
}

async function ensureLanBridge(upstreamOrigin) {
  if (lanBridgeServer && lanBridgePort && lanBridgeUpstreamUrl === upstreamOrigin) {
    return {
      running: true,
      reused: true,
      port: lanBridgePort,
      upstreamUrl: lanBridgeUpstreamUrl,
      localUrl: `http://localhost:${lanBridgePort}`,
      lanUrls: getLanUrls(lanBridgePort),
    };
  }

  if (lanBridgeServer) {
    await stopLanBridge();
  }

  const server = http.createServer((request, response) => {
    proxyHttpRequest(request, response, upstreamOrigin);
  });

  server.on('upgrade', (request, socket, head) => {
    proxyUpgradeRequest(request, socket, head, upstreamOrigin);
  });

  server.on('clientError', (error, socket) => {
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
  });

  const port = await listenLanBridge(server, LAN_BRIDGE_PORT);
  lanBridgeServer = server;
  lanBridgePort = port;
  lanBridgeUpstreamUrl = upstreamOrigin;
  appendServerLog('lan-bridge', `listening on ${LAN_BRIDGE_HOST}:${port} -> ${upstreamOrigin}`);

  return {
    running: true,
    reused: false,
    port,
    upstreamUrl: upstreamOrigin,
    localUrl: `http://localhost:${port}`,
    lanUrls: getLanUrls(port),
  };
}

function getStandaloneServerPath() {
  const appRoot = path.join(__dirname, '..');
  const candidates = [
    path.join(process.resourcesPath || '', 'standalone', 'server.js'),
    path.join(app.getAppPath(), 'standalone', 'server.js'),
    path.join(app.getAppPath(), '.next', 'standalone', 'server.js'),
    path.join(appRoot, '.next', 'standalone', 'server.js'),
  ];

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate;
    } catch {
      // Ignore invalid candidate paths.
    }
  }

  return null;
}

function appendServerLog(source, chunk) {
  const text = chunk.toString().trim();
  if (!text) return;

  localServerLog.push(`[${source}] ${text}`);
  if (localServerLog.length > 80) {
    localServerLog = localServerLog.slice(localServerLog.length - 80);
  }
}

function appendStabilityLog(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);

  try {
    const logDir = app.isReady() ? app.getPath('logs') : path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'stability.log'), `${line}\n`, 'utf8');
  } catch {
    // Console output is enough if the log path is not writable.
  }
}

function clearUnresponsiveReloadTimer() {
  if (!unresponsiveReloadTimer) return;
  clearTimeout(unresponsiveReloadTimer);
  unresponsiveReloadTimer = null;
}

function reloadMainWindow(reason) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  appendStabilityLog(`Reloading main window: ${reason}`);
  try {
    mainWindow.webContents.reloadIgnoringCache();
  } catch (error) {
    appendStabilityLog(`Unable to reload main window: ${error.message}`);
  }
}

async function runRendererMaintenance(reason) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    await mainWindow.webContents.session.clearCache();
    appendStabilityLog(`Renderer cache cleared: ${reason}`);
  } catch (error) {
    appendStabilityLog(`Unable to clear renderer cache: ${error.message}`);
  }
}

function startHealthCheck() {
  if (healthCheckTimer) clearInterval(healthCheckTimer);

  healthCheckTimer = setInterval(() => {
    runRendererMaintenance('scheduled').catch((error) => {
      appendStabilityLog(`Scheduled maintenance failed: ${error.message}`);
    });
  }, HEALTH_CHECK_INTERVAL_MS);

  if (typeof healthCheckTimer.unref === 'function') {
    healthCheckTimer.unref();
  }
}

function stopHealthCheck() {
  if (!healthCheckTimer) return;
  clearInterval(healthCheckTimer);
  healthCheckTimer = null;
}

function setupStabilityHandlers(window) {
  window.on('unresponsive', () => {
    appendStabilityLog('Main renderer became unresponsive');
    clearUnresponsiveReloadTimer();

    unresponsiveReloadTimer = setTimeout(() => {
      reloadMainWindow('renderer unresponsive');
      clearUnresponsiveReloadTimer();
    }, RENDERER_RECOVERY_DELAY_MS);
  });

  window.on('responsive', () => {
    appendStabilityLog('Main renderer recovered');
    clearUnresponsiveReloadTimer();
  });

  window.webContents.on('render-process-gone', (event, details) => {
    appendStabilityLog(`Renderer process gone reason=${details.reason} exitCode=${details.exitCode}`);

    if (details.reason !== 'clean-exit' && details.reason !== 'killed') {
      reloadMainWindow(`renderer ${details.reason}`);
    }
  });
}

function normalizeDialogMessage(message) {
  const text = String(message ?? '');
  return text.length > 4000 ? `${text.slice(0, 4000)}...` : text;
}

function refocusWindowAfterDialog(window) {
  if (!window || window.isDestroyed()) return;

  setTimeout(() => {
    if (!window || window.isDestroyed()) return;

    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
    window.webContents.focus();
  }, 40);
}

function getDialogParent(event) {
  return BrowserWindow.fromWebContents(event.sender) || mainWindow;
}

function installRendererDialogOverrides() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  mainWindow.webContents.executeJavaScript(`
    (() => {
      if (window.__smileElectronDialogsInstalled) return;

      const api = window.electronAPI;
      if (!api || typeof api.showAlertSync !== 'function' || typeof api.showConfirmSync !== 'function') return;

      const browserAlert = window.alert.bind(window);
      const browserConfirm = window.confirm.bind(window);

      function getFocusedElement() {
        const element = document.activeElement;
        return element && typeof element.focus === 'function' ? element : null;
      }

      function refocusElement(element) {
        window.setTimeout(() => {
          try {
            if (element && document.contains(element)) {
              element.focus({ preventScroll: true });
              return;
            }

            if (document.body && typeof document.body.focus === 'function') {
              document.body.focus({ preventScroll: true });
            }
          } catch {}
        }, 0);
      }

      Object.defineProperty(window, '__smileElectronDialogsInstalled', {
        value: true,
        configurable: false,
      });

      window.alert = function electronAlert(message) {
        const focusedElement = getFocusedElement();

        try {
          api.showAlertSync(message);
        } catch {
          browserAlert(message);
        }

        refocusElement(focusedElement);
      };

      window.confirm = function electronConfirm(message) {
        const focusedElement = getFocusedElement();
        let confirmed = false;

        try {
          confirmed = Boolean(api.showConfirmSync(message));
        } catch {
          confirmed = browserConfirm(message);
        }

        refocusElement(focusedElement);
        return confirmed;
      };
    })();
  `, true).catch((error) => {
    appendStabilityLog(`Unable to install dialog overrides: ${error.message}`);
  });
}

function getDefaultDatabaseUrl() {
  return process.env.DATABASE_URL || 'postgresql://myuser:mypassword@localhost:5433/mydb?schema=public';
}

async function ensureLocalServer() {
  const localUrl = getLocalAppUrl();
  const existing = await probeUrl(localUrl, 1800);

  if (existing.ok) {
    return { started: false, external: true, url: localUrl };
  }

  if (localServerProcess && !localServerProcess.killed) {
    return { started: false, running: true, pid: localServerProcess.pid, url: localUrl };
  }

  const serverFile = getStandaloneServerPath();
  if (!serverFile) {
    throw new Error('ไม่พบไฟล์ .next/standalone/server.js กรุณารัน npm run build:electron ก่อนใช้งานโหมด Server');
  }

  const standaloneDir = path.dirname(serverFile);
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_ENV: 'production',
    PORT: String(DEFAULT_APP_PORT),
    HOSTNAME: '0.0.0.0',
    DATABASE_URL: getDefaultDatabaseUrl(),
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || localUrl,
  };

  localServerLog = [];
  localServerProcess = spawn(process.execPath, [serverFile], {
    cwd: standaloneDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  localServerProcess.stdout.on('data', (chunk) => appendServerLog('server', chunk));
  localServerProcess.stderr.on('data', (chunk) => appendServerLog('server:error', chunk));
  localServerProcess.on('exit', (code, signal) => {
    appendServerLog('server', `exited code=${code ?? 'null'} signal=${signal ?? 'null'}`);
    localServerProcess = null;
  });

  return { started: true, pid: localServerProcess.pid, url: localUrl, serverFile };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function probeUrl(origin, timeoutMs = CONNECT_TIMEOUT_MS, probePath = CONNECT_PROBE_PATH) {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    let target;
    try {
      target = new URL(origin);
    } catch (error) {
      finish({ ok: false, error: error.message || 'Invalid URL' });
      return;
    }

    const transport = target.protocol === 'https:' ? https : http;
    const requestPath = String(probePath || '/').startsWith('/') ? String(probePath || '/') : `/${probePath}`;
    const request = transport.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: requestPath,
      method: 'GET',
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'SmilePharmacyElectronLauncher/1.0',
      },
    }, (response) => {
      response.resume();
      finish({
        ok: Boolean(response.statusCode && response.statusCode < 500),
        statusCode: response.statusCode,
        url: target.origin,
        path: requestPath,
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error('Connection timeout'));
    });

    request.on('error', (error) => {
      finish({
        ok: false,
        error: error.message || 'Connection failed',
        code: error.code,
        url: target.origin,
        path: requestPath,
      });
    });

    request.end();
  });
}

async function waitForUrl(origin, timeoutMs) {
  const startedAt = Date.now();
  let lastError = 'Connection timeout';

  while (Date.now() - startedAt < timeoutMs) {
    const result = await probeUrl(origin, Math.min(3500, timeoutMs));
    if (result.ok) return result;

    lastError = describeProbeFailure(result, origin);
    await delay(700);
  }

  throw new Error(lastError);
}

async function loadAppUrl(connection, options = {}) {
  const { save = true } = options;
  await waitForUrl(connection.url, CONNECT_TIMEOUT_MS);
  await mainWindow.loadURL(connection.url);

  if (save) {
    saveConnection(connection);
  }

  return { success: true, connection };
}

async function connectServerMode() {
  const startup = await ensureLocalServer();
  const localUrl = getLocalAppUrl();
  await waitForUrl(localUrl, LOCAL_SERVER_TIMEOUT_MS);
  const lanAccess = await prepareServerLanAccess(startup);

  // เครื่องนี้เป็น Server = เป็นเจ้าของเครื่องพิมพ์ ต้องรับงานพิมพ์แทนแท็บเล็ตด้วย
  startPrintAgent(localUrl);

  return loadAppUrl({
    mode: 'server',
    host: DEFAULT_APP_HOST,
    port: DEFAULT_APP_PORT,
    url: localUrl,
  }, { save: true }).then((result) => ({ ...result, startup, lanAccess }));
}

async function connectClientMode(input) {
  const target = normalizeServerInput(input, { defaultPort: getClientDefaultPort() });

  return loadAppUrl({
    mode: 'client',
    host: target.host,
    port: target.port,
    url: target.url,
  }, { save: true });
}

async function restoreSavedConnection() {
  const savedConnection = getSavedConnection();

  if (!savedConnection) {
    loadConnectPage();
    return;
  }

  try {
    if (savedConnection.mode === 'server') {
      const startup = await ensureLocalServer();
      await waitForUrl(savedConnection.url, LOCAL_SERVER_TIMEOUT_MS);
      await prepareServerLanAccess(startup);
      startPrintAgent(savedConnection.url);
    }

    await loadAppUrl(savedConnection, { save: false });
  } catch (error) {
    console.log(`Saved connection failed: ${error.message}`);
    loadConnectPage();
  }
}

function getExtendDisplay() {
  try {
    const primary = screen.getPrimaryDisplay();
    // หาจอที่ไม่ใช่จอหลัก (จอ Extend / จอลูกค้า)
    return screen.getAllDisplays().find((d) => d.id !== primary.id) || null;
  } catch {
    return null;
  }
}

function getCustomerDisplayUrl() {
  try {
    const current = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.getURL() : '';
    if (current && /^https?:/i.test(current)) {
      return `${new URL(current).origin}/web/sales/customer`;
    }
  } catch {
    // ignore and fall back below
  }

  const base = (process.env.ELECTRON_APP_URL || getLocalAppUrl()).replace(/\/+$/, '');
  return `${base}/web/sales/customer`;
}

function closeCustomerDisplay() {
  if (customerWindow && !customerWindow.isDestroyed()) {
    customerWindow.destroy();
  }
  customerWindow = null;
}

async function openCustomerDisplay() {
  const extend = getExtendDisplay();

  // ไม่มีจอ Extend → ไม่ต้องแสดงจอลูกค้า
  if (!extend) {
    closeCustomerDisplay();
    return { opened: false, reason: 'no-extend-display' };
  }

  const { x, y, width, height } = extend.bounds;
  const url = getCustomerDisplayUrl();

  // เปิดอยู่แล้ว → ย้ายไปจอ Extend แล้วโฟกัส
  if (customerWindow && !customerWindow.isDestroyed()) {
    customerWindow.setBounds({ x, y, width, height });
    if (!customerWindow.isVisible()) customerWindow.show();
    return { opened: true, reused: true, url };
  }

  customerWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    fullscreen: true,
    frame: false,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, '..', 'public', 'app-icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  customerWindow.on('closed', () => {
    customerWindow = null;
  });

  // เปิดลิงก์ภายนอกด้วยเบราว์เซอร์ ไม่สร้างหน้าต่างใหม่
  customerWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    shell.openExternal(openUrl);
    return { action: 'deny' };
  });

  try {
    await customerWindow.loadURL(url);
  } catch (error) {
    console.log(`Customer display failed to load: ${error.message}`);
  }

  return { opened: true, url };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 680,
    icon: path.join(__dirname, '..', 'public', 'app-icon.png'),
    backgroundColor: '#f7f9fc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      zoomFactor: 1.0,
      enableBlinkFeatures: '',
    },
    autoHideMenuBar: true,
    useContentSize: true,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // B4: บล็อกการปิดหน้าต่าง (ปุ่ม X / Ctrl+W / Alt+F4) ระหว่างล็อกหน้าชำระเงิน
  // ยกเว้นตอนสั่งปิดโปรแกรมจริง (isQuitting) เพื่อไม่ให้ค้างปิดไม่ได้
  mainWindow.on('close', (e) => {
    if (payLocked && !isQuitting) {
      e.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    closeCustomerDisplay();
  });

  // B4: บล็อกคีย์รีเฟรช/ปิด (F5, Ctrl+R, Ctrl+Shift+R, Ctrl+W) ระหว่างล็อกหน้าชำระเงิน
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!payLocked || input.type !== 'keyDown') return;
    const key = (input.key || '').toLowerCase();
    const mod = input.control || input.meta;
    if (key === 'f5' || (mod && (key === 'r' || key === 'w'))) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('dom-ready', () => {
    installRendererDialogOverrides();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    payLocked = false; // โหลดหน้าใหม่ = ปลดล็อกไว้ก่อน (ตัวหน้าจะสั่งล็อกกลับเองถ้ายังอยู่หน้าชำระเงิน) กันค้าง
    mainWindow.webContents.setZoomFactor(1.0);
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
    installRendererDialogOverrides();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  setupStabilityHandlers(mainWindow);
  restoreSavedConnection();
  createTray();
}

function loadConnectPage() {
  if (!mainWindow) return;
  mainWindow.loadFile(path.join(__dirname, 'connect.html'));
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'public', 'app-icon.png');

  if (!fs.existsSync(iconPath)) {
    console.log('Tray icon not found, skipping tray creation');
    return;
  }

  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'เปิดโปรแกรม',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'ตั้งค่าการเชื่อมต่อ',
      click: () => {
        loadConnectPage();
        mainWindow.show();
      },
    },
    {
      label: 'รีเซ็ตการเชื่อมต่อ',
      click: () => {
        clearConnection();
        loadConnectPage();
        mainWindow.show();
      },
    },
    { type: 'separator' },
    {
      label: 'ออกจากโปรแกรม',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Smile Pharmacy POS');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    mainWindow.show();
  });
}

function getLauncherState() {
  const localUrl = getLocalAppUrl();
  const clientPort = getClientDefaultPort();

  return {
    appVersion: app.getVersion(),
    localUrl,
    defaultPort: DEFAULT_APP_PORT,
    clientPort,
    savedConnection: getSavedConnection(),
    standaloneAvailable: Boolean(getStandaloneServerPath()),
    serverRunning: Boolean(localServerProcess && !localServerProcess.killed),
    serverPid: localServerProcess?.pid || null,
    lanBridgeRunning: Boolean(lanBridgeServer && lanBridgePort),
    lanBridgePort,
    lanBridgeUpstreamUrl,
    serverLog: localServerLog.slice(-20),
    lanUrls: getBridgeLanUrls(),
  };
}

function escapeHtmlAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getPrintBaseUrl() {
  try {
    const currentUrl = mainWindow?.webContents?.getURL();
    if (currentUrl) {
      const parsed = new URL(currentUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return `${parsed.origin}/`;
      }
    }
  } catch {
    // Fall back to the configured local app URL.
  }

  return `${getLocalAppUrl()}/`;
}

function normalizePrintPayload(payload) {
  if (typeof payload === 'string') {
    return { content: payload, printerName: '', horizontalOffset: 0 };
  }

  return {
    content: String(payload?.content || ''),
    printerName: String(payload?.printerName || '').trim(),
    horizontalOffset: Number(payload?.horizontalOffset || 0),
  };
}

function buildPrintHtml(payload) {
  const baseUrl = getPrintBaseUrl();
  const horizontalOffset = Number.isFinite(payload.horizontalOffset) ? payload.horizontalOffset : 0;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <base href="${escapeHtmlAttribute(baseUrl)}">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .electron-print-root {
      width: fit-content;
      margin: 0;
      padding: 0;
      transform: translateX(${horizontalOffset}px);
      transform-origin: top left;
    }
    @page {
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="electron-print-root">${payload.content}</div>
</body>
</html>`;
}

async function waitForPrintableAssets(printWindow) {
  await printWindow.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const timer = setTimeout(() => resolve(true), ${PRINT_ASSET_TIMEOUT_MS});
      Promise.all([
        document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => true) : Promise.resolve(true),
        Promise.all(Array.from(document.images).map((img) => {
          if (img.complete) return true;
          return new Promise((done) => {
            img.onload = () => done(true);
            img.onerror = () => done(true);
          });
        }))
      ]).then(() => {
        clearTimeout(timer);
        resolve(true);
      }).catch(() => {
        clearTimeout(timer);
        resolve(true);
      });
    })
  `, true).catch(() => true);

  await delay(250);
}

function printWebContents(webContents, options) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Print timeout'));
    }, PRINT_TIMEOUT_MS);

    webContents.print(options, (success, failureReason) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (success) {
        resolve({ success: true });
        return;
      }

      reject(new Error(failureReason || 'Print failed'));
    });
  });
}

async function getSystemPrinters() {
  if (!mainWindow?.webContents?.getPrintersAsync) {
    return [];
  }

  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers.map((printer) => ({
    ...printer,
    name: printer.name,
    displayName: printer.displayName || printer.name,
    isDefault: Boolean(printer.isDefault),
  }));
}

async function printSilent(payloadInput) {
  const payload = normalizePrintPayload(payloadInput);

  if (!payload.content.trim()) {
    throw new Error('Print content is empty');
  }

  const printWindow = new BrowserWindow({
    show: false,
    backgroundColor: '#ffffff',
    paintWhenInitiallyHidden: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  const destroyTimer = setTimeout(() => {
    if (!printWindow.isDestroyed()) {
      appendStabilityLog('Destroying stale print window after timeout');
      printWindow.destroy();
    }
  }, PRINT_TIMEOUT_MS + PRINT_ASSET_TIMEOUT_MS + 5000);

  try {
    const html = buildPrintHtml(payload);
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await waitForPrintableAssets(printWindow);

    const printOptions = {
      silent: true,
      printBackground: true,
      deviceName: payload.printerName || undefined,
      margins: { marginType: 'none' },
    };

    const result = await printWebContents(printWindow.webContents, printOptions);
    printJobCount += 1;

    if (printJobCount % 20 === 0) {
      runRendererMaintenance(`after ${printJobCount} print jobs`).catch((error) => {
        appendStabilityLog(`Post-print maintenance failed: ${error.message}`);
      });
    }

    return result;
  } finally {
    clearTimeout(destroyTimer);
    if (!printWindow.isDestroyed()) {
      printWindow.destroy();
    }
  }
}

function enqueuePrintSilent(payload) {
  const job = printQueue.then(() => printSilent(payload), () => printSilent(payload));
  printQueue = job.catch(() => undefined);
  return job;
}

/* =========================================================================
 *  Print Agent — พิมพ์แทนแท็บเล็ต Android
 *
 *  แท็บเล็ตไม่มีเครื่องพิมพ์ต่ออยู่ เครื่องนี้ (เคาน์เตอร์) เป็นตัวที่ต่อ
 *  จึงเปิด SSE ค้างไว้ที่ /api/print/stream รอรับงาน แล้วส่งเข้า enqueuePrintSilent()
 *  ตัวเดิม — ใบเสร็จที่ออกจากแท็บเล็ตจึงหน้าตาเหมือนกับที่สั่งพิมพ์จากเครื่องนี้ทุกประการ
 *
 *  ทำงานเฉพาะโหมด Server เท่านั้น เครื่องลูกที่เป็น Client ไม่ต้องรับงานแทนใคร
 * ========================================================================= */

const PRINT_AGENT_RETRY_MS = Number(process.env.ELECTRON_PRINT_AGENT_RETRY_MS || 5000);

function postPrintResult(payload) {
  return new Promise((resolve) => {
    if (!printAgentBaseUrl) {
      resolve(false);
      return;
    }

    let target;
    try {
      target = new URL('/api/print/result', printAgentBaseUrl);
    } catch {
      resolve(false);
      return;
    }

    const body = Buffer.from(JSON.stringify(payload), 'utf8');
    const transport = target.protocol === 'https:' ? https : http;

    const request = transport.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: target.pathname,
      method: 'POST',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      },
    }, (response) => {
      response.resume();
      resolve(true);
    });

    request.on('timeout', () => request.destroy(new Error('result timeout')));
    request.on('error', () => resolve(false));
    request.end(body);
  });
}

async function handlePrintAgentEvent(event) {
  if (!event || typeof event !== 'object') return;

  if (event.type === 'printers:refresh') {
    const printers = await getSystemPrinters().catch(() => []);
    await postPrintResult({ printers });
    return;
  }

  if (event.type !== 'print:job' || !event.id) return;

  try {
    await enqueuePrintSilent(event.payload || {});
    appendServerLog('print-agent', `job ${event.id} printed`);
    await postPrintResult({ id: event.id, success: true });
  } catch (error) {
    appendServerLog('print-agent', `job ${event.id} failed: ${error.message}`);
    await postPrintResult({ id: event.id, success: false, error: error.message });
  }
}

function schedulePrintAgentRetry() {
  if (printAgentStopped || printAgentRetryTimer) return;

  printAgentRetryTimer = setTimeout(() => {
    printAgentRetryTimer = null;
    connectPrintAgent();
  }, PRINT_AGENT_RETRY_MS);

  if (typeof printAgentRetryTimer.unref === 'function') {
    printAgentRetryTimer.unref();
  }
}

function connectPrintAgent() {
  if (printAgentStopped || printAgentRequest || !printAgentBaseUrl) return;

  let target;
  try {
    target = new URL('/api/print/stream', printAgentBaseUrl);
  } catch {
    return;
  }

  const transport = target.protocol === 'https:' ? https : http;

  const request = transport.request({
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    path: target.pathname,
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  }, (response) => {
    if (response.statusCode !== 200) {
      response.resume();
      printAgentRequest = null;
      schedulePrintAgentRetry();
      return;
    }

    appendServerLog('print-agent', `connected to ${target.href}`);
    response.setEncoding('utf8');

    // ส่งรายชื่อเครื่องพิมพ์ทันทีที่ต่อติด แท็บเล็ตจะได้เลือกปลายทางได้เลย
    getSystemPrinters()
      .then((printers) => postPrintResult({ printers }))
      .catch(() => undefined);

    let buffer = '';

    response.on('data', (chunk) => {
      buffer += chunk;

      // SSE คั่นแต่ละ event ด้วยบรรทัดว่าง
      let separator = buffer.indexOf('\n\n');

      while (separator !== -1) {
        const rawEvent = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);

        const data = rawEvent
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('');

        if (data) {
          try {
            handlePrintAgentEvent(JSON.parse(data));
          } catch (error) {
            appendServerLog('print-agent', `bad event: ${error.message}`);
          }
        }

        separator = buffer.indexOf('\n\n');
      }
    });

    const onClosed = () => {
      if (printAgentRequest !== request) return;
      printAgentRequest = null;
      appendServerLog('print-agent', 'disconnected');
      schedulePrintAgentRetry();
    };

    response.on('end', onClosed);
    response.on('close', onClosed);
    response.on('error', onClosed);
  });

  request.on('error', (error) => {
    if (printAgentRequest === request) printAgentRequest = null;
    appendServerLog('print-agent', `connect error: ${error.message}`);
    schedulePrintAgentRetry();
  });

  printAgentRequest = request;
  request.end();
}

function startPrintAgent(baseUrl) {
  printAgentBaseUrl = baseUrl;
  printAgentStopped = false;
  connectPrintAgent();
}

function stopPrintAgent() {
  printAgentStopped = true;

  if (printAgentRetryTimer) {
    clearTimeout(printAgentRetryTimer);
    printAgentRetryTimer = null;
  }

  if (printAgentRequest) {
    try {
      printAgentRequest.destroy();
    } catch {
      // กำลังปิดโปรแกรมอยู่แล้ว ไม่ต้องทำอะไรต่อ
    }
    printAgentRequest = null;
  }
}

ipcMain.handle('get-printers', async () => {
  try {
    return await getSystemPrinters();
  } catch (error) {
    console.log(`Unable to read printers: ${error.message}`);
    return [];
  }
});

ipcMain.handle('print-silent', async (event, payload) => {
  return enqueuePrintSilent(payload);
});

ipcMain.on('show-alert-sync', (event, message) => {
  const parent = getDialogParent(event);

  try {
    dialog.showMessageBoxSync(parent, {
      type: 'info',
      buttons: ['ตกลง'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
      message: normalizeDialogMessage(message),
    });
  } finally {
    refocusWindowAfterDialog(parent);
    event.returnValue = true;
  }
});

ipcMain.on('show-confirm-sync', (event, message) => {
  const parent = getDialogParent(event);
  let result = 1;

  try {
    result = dialog.showMessageBoxSync(parent, {
      type: 'question',
      buttons: ['ตกลง', 'ยกเลิก'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
      message: normalizeDialogMessage(message),
    });
  } finally {
    refocusWindowAfterDialog(parent);
    event.returnValue = result === 0;
  }
});

ipcMain.handle('connect-server', async (event, input) => {
  try {
    return await connectClientMode(input);
  } catch (error) {
    loadConnectPage();
    return { success: false, error: error.message || 'Connection failed' };
  }
});

ipcMain.handle('connect-localhost', async () => {
  try {
    return await connectServerMode();
  } catch (error) {
    loadConnectPage();
    return {
      success: false,
      error: error.message || 'Connection failed',
      serverLog: localServerLog.slice(-20),
    };
  }
});

ipcMain.handle('test-connection', async (event, input) => {
  try {
    const target = input ? normalizeServerInput(input, { defaultPort: getClientDefaultPort() }) : { url: getLocalAppUrl() };
    const result = await probeUrl(target.url, CONNECT_TIMEOUT_MS);
    return { ...result, url: target.url };
  } catch (error) {
    return { ok: false, error: error.message || 'Connection failed' };
  }
});

ipcMain.handle('get-launcher-state', () => getLauncherState());

ipcMain.handle('open-customer-display', () => openCustomerDisplay());

ipcMain.handle('close-customer-display', () => {
  closeCustomerDisplay();
  return { closed: true };
});

// B4: หน้าชำระเงินสั่งล็อก/ปลดล็อกการปิด-รีเฟรชหน้าต่าง (กันทุจริต)
ipcMain.handle('set-pay-lock', (_event, locked) => {
  payLocked = !!locked;
  return { payLocked };
});

ipcMain.handle('get-saved-ip', () => {
  const savedConnection = getSavedConnection();
  return savedConnection?.host || null;
});

ipcMain.handle('clear-saved-ip', () => {
  clearConnection();
  return true;
});

ipcMain.handle('start-smartcard-agent', async () => {
  try {
    if (process.platform !== 'win32') {
      return { started: false, error: 'รองรับเฉพาะ Windows' };
    }

    const candidates = [
      path.join(process.resourcesPath || '', 'smartcard-agent', 'start.bat'),
      path.join(app.getAppPath(), '..', 'smartcard-agent', 'start.bat'),
      path.join(app.getAppPath(), 'smartcard-agent', 'start.bat'),
      path.join(path.dirname(app.getPath('exe')), 'smartcard-agent', 'start.bat'),
      path.join(path.dirname(app.getPath('exe')), '..', 'smartcard-agent', 'start.bat'),
      'C:\\SmilePOS\\smartcard-agent\\start.bat',
      // ที่ติดตั้งเดิมก่อนเปลี่ยนชื่อโฟลเดอร์ — เก็บไว้ให้เครื่องที่ยังไม่ได้ย้ายใช้ได้อยู่
      'C:\\SmilePharmacy\\smartcard-agent\\start.bat',
      'C:\\smartcard-agent\\start.bat',
    ];

    let bat = null;
    for (const candidate of candidates) {
      try {
        if (candidate && fs.existsSync(candidate)) {
          bat = candidate;
          break;
        }
      } catch {
        // Ignore invalid paths.
      }
    }

    if (!bat) {
      return { started: false, error: 'ไม่พบไฟล์ smartcard-agent\\start.bat' };
    }

    const cwd = path.dirname(bat);
    const child = spawn(`start "" /D "${cwd}" "${bat}"`, {
      shell: true,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    child.unref();

    return { started: true, path: bat };
  } catch (error) {
    return { started: false, error: error?.message || 'Internal error' };
  }
});

ipcMain.handle('check-smartcard-agent', async () => {
  try {
    if (process.platform !== 'win32') return { available: false };
    const candidates = [
      path.join(process.resourcesPath || '', 'smartcard-agent', 'start.bat'),
      path.join(app.getAppPath(), '..', 'smartcard-agent', 'start.bat'),
      path.join(app.getAppPath(), 'smartcard-agent', 'start.bat'),
      path.join(path.dirname(app.getPath('exe')), 'smartcard-agent', 'start.bat'),
      path.join(path.dirname(app.getPath('exe')), '..', 'smartcard-agent', 'start.bat'),
      'C:\\SmilePOS\\smartcard-agent\\start.bat',
      // ที่ติดตั้งเดิมก่อนเปลี่ยนชื่อโฟลเดอร์ — เก็บไว้ให้เครื่องที่ยังไม่ได้ย้ายใช้ได้อยู่
      'C:\\SmilePharmacy\\smartcard-agent\\start.bat',
      'C:\\smartcard-agent\\start.bat',
    ];

    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) return { available: true, path: candidate };
    }

    return { available: false };
  } catch {
    return { available: false };
  }
});

/* =========================================================================
 *  ตั้งเวลา เปิด-ปิด เครื่องอัตโนมัติ (Auto power on/off scheduler)
 *  ใช้ Windows Task Scheduler (schtasks) เป็นกลไกจริง
 *    - ปิดเครื่อง / Sleep / Hibernate ตามเวลาที่ตั้ง
 *    - ปลุกเครื่อง (Wake to run) ตามเวลาที่ตั้ง โดยใช้ <WakeToRun> ใน XML
 * ========================================================================= */

const POWER_SCHEDULE_KEY = 'powerSchedule';
const POWER_TASK_SHUTDOWN = 'SmilePharmacy_AutoPowerOff';
const POWER_TASK_WAKE = 'SmilePharmacy_AutoPowerOn';

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_TO_SCHTASKS = {
  mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT', sun: 'SUN',
};
const DAY_TO_XML = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

const DEFAULT_POWER_SCHEDULE = {
  onEnabled: false,
  onTime: '08:00',
  offEnabled: false,
  offTime: '20:00',
  offAction: 'shutdown', // 'shutdown' | 'sleep' | 'hibernate'
  warningSec: 60,
  days: [...DAY_ORDER],
};

function normalizeTime(value, fallback) {
  const m = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function normalizePowerSchedule(input) {
  const src = input && typeof input === 'object' ? input : {};
  let days = Array.isArray(src.days)
    ? src.days.filter((d) => DAY_ORDER.includes(d))
    : [...DEFAULT_POWER_SCHEDULE.days];
  if (days.length === 0) days = [...DEFAULT_POWER_SCHEDULE.days];
  // เรียงตามลำดับวันให้คงที่
  days = DAY_ORDER.filter((d) => days.includes(d));

  const offAction = ['shutdown', 'sleep', 'hibernate'].includes(src.offAction)
    ? src.offAction
    : DEFAULT_POWER_SCHEDULE.offAction;

  let warningSec = parseInt(src.warningSec, 10);
  if (!Number.isFinite(warningSec) || warningSec < 0) warningSec = DEFAULT_POWER_SCHEDULE.warningSec;
  warningSec = Math.min(600, warningSec);

  return {
    onEnabled: !!src.onEnabled,
    onTime: normalizeTime(src.onTime, DEFAULT_POWER_SCHEDULE.onTime),
    offEnabled: !!src.offEnabled,
    offTime: normalizeTime(src.offTime, DEFAULT_POWER_SCHEDULE.offTime),
    offAction,
    warningSec,
    days,
  };
}

function getPowerSchedule() {
  return normalizePowerSchedule(store.get(POWER_SCHEDULE_KEY));
}

function runSchtasks(args) {
  // ใช้ chcp + spawnSync เพื่ออ่านผลแบบ utf8 ปลอดภัย
  const res = spawnSync('schtasks', args, {
    windowsHide: true,
    encoding: 'utf8',
  });
  return {
    ok: res.status === 0,
    code: res.status,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
    error: res.error ? res.error.message : null,
  };
}

function deleteScheduledTask(taskName) {
  return runSchtasks(['/Delete', '/TN', taskName, '/F']);
}

function scheduledTaskExists(taskName) {
  const res = runSchtasks(['/Query', '/TN', taskName]);
  return res.ok;
}

// escape ข้อความสำหรับใส่ใน XML element
function xmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// คำสั่งที่ใช้ตอนปิดเครื่อง/Sleep/Hibernate (string เดียว — ใช้สำหรับ preview)
function buildOffCommand(schedule) {
  const exec = buildOffExec(schedule);
  return exec.arguments ? `${exec.command} ${exec.arguments}` : exec.command;
}

// แยกคำสั่งปิดเครื่องเป็น command + arguments เพื่อใส่ใน <Exec> ของ Task XML
function buildOffExec(schedule) {
  if (schedule.offAction === 'sleep') {
    // Sleep: เข้าโหมด suspend โดยอนุญาตให้ wake event ปลุกได้ (พารามิเตอร์ตัวที่ 3 = 0)
    return { command: 'rundll32.exe', arguments: 'powrprof.dll,SetSuspendState 0,1,0' };
  }
  if (schedule.offAction === 'hibernate') {
    return { command: 'shutdown', arguments: '/h' };
  }
  const delay = Math.max(0, parseInt(schedule.warningSec, 10) || 0);
  return {
    command: 'shutdown',
    arguments: `/s /f /t ${delay} /c "Smile Pharmacy: ปิดเครื่องอัตโนมัติตามเวลาที่ตั้งไว้"`,
  };
}

// สร้าง XML สำหรับ Task ปิดเครื่อง — ตั้งให้ทำงานได้แม้ใช้แบตเตอรี่
function buildShutdownTaskXml(schedule) {
  const exec = buildOffExec(schedule);
  const daysXml = schedule.days.map((d) => `        <${DAY_TO_XML[d]} />`).join('\n');
  const startBoundary = `2020-01-01T${schedule.offTime}:00`;
  const argsXml = exec.arguments
    ? `\n      <Arguments>${xmlEscape(exec.arguments)}</Arguments>`
    : '';

  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.3" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Smile Pharmacy - ปิดเครื่อง/Sleep/Hibernate อัตโนมัติตามเวลาที่ตั้งไว้</Description>
    <Author>Smile Pharmacy</Author>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>${startBoundary}</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByWeek>
        <DaysOfWeek>
${daysXml}
        </DaysOfWeek>
        <WeeksInterval>1</WeeksInterval>
      </ScheduleByWeek>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${xmlEscape(exec.command)}</Command>${argsXml}
    </Exec>
  </Actions>
</Task>`;
}

// สร้าง Task ปิดเครื่อง ผ่าน schtasks /XML (ตั้งค่าให้รันได้แม้ใช้แบตเตอรี่)
function applyShutdownTask(schedule) {
  deleteScheduledTask(POWER_TASK_SHUTDOWN);
  if (!schedule.offEnabled) return { ok: true, skipped: true };

  const xml = buildShutdownTaskXml(schedule);
  const xmlPath = path.join(app.getPath('temp'), `smile_power_off_${Date.now()}.xml`);
  try {
    // schtasks /XML ต้องการไฟล์ encoding UTF-16 LE ตาม header ที่ระบุ
    fs.writeFileSync(xmlPath, '﻿' + xml, { encoding: 'utf16le' });
    const res = runSchtasks(['/Create', '/F', '/TN', POWER_TASK_SHUTDOWN, '/XML', xmlPath]);
    return res;
  } finally {
    try { fs.unlinkSync(xmlPath); } catch { /* ignore */ }
  }
}

// สร้าง XML สำหรับ Task ปลุกเครื่อง (WakeToRun) แล้ว import ผ่าน schtasks /XML
function buildWakeTaskXml(schedule) {
  const exePath = app.getPath('exe');
  const daysXml = schedule.days.map((d) => `        <${DAY_TO_XML[d]} />`).join('\n');
  // ใช้วันที่ฐานในอดีตเพื่อให้ trigger เริ่มทำงานทันที
  const startBoundary = `2020-01-01T${schedule.onTime}:00`;

  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.3" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Smile Pharmacy - ปลุกเครื่องและเปิดโปรแกรมอัตโนมัติตามเวลาที่ตั้งไว้</Description>
    <Author>Smile Pharmacy</Author>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>${startBoundary}</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByWeek>
        <DaysOfWeek>
${daysXml}
        </DaysOfWeek>
        <WeeksInterval>1</WeeksInterval>
      </ScheduleByWeek>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>true</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${exePath}</Command>
    </Exec>
  </Actions>
</Task>`;
}

// เปิดใช้งาน wake timers ในแผนการใช้พลังงานปัจจุบัน เพื่อให้ WakeToRun ทำงาน
function enableWakeTimers() {
  const GUID_SLEEP_SUB = '238c9fa8-0aad-41ed-83f4-97be242c8f20';
  const GUID_RTCWAKE = 'bd3b718a-0680-4d9d-8ab2-e1d2b4ac806d';
  spawnSync('powercfg', ['/SETACVALUEINDEX', 'SCHEME_CURRENT', GUID_SLEEP_SUB, GUID_RTCWAKE, '1'], { windowsHide: true });
  spawnSync('powercfg', ['/SETDCVALUEINDEX', 'SCHEME_CURRENT', GUID_SLEEP_SUB, GUID_RTCWAKE, '1'], { windowsHide: true });
  spawnSync('powercfg', ['/SETACTIVE', 'SCHEME_CURRENT'], { windowsHide: true });
}

function applyWakeTask(schedule) {
  deleteScheduledTask(POWER_TASK_WAKE);
  if (!schedule.onEnabled) return { ok: true, skipped: true };

  enableWakeTimers();

  const xml = buildWakeTaskXml(schedule);
  const xmlPath = path.join(app.getPath('temp'), `smile_power_wake_${Date.now()}.xml`);
  try {
    // schtasks /XML ต้องการไฟล์ encoding UTF-16 LE ตาม header ที่ระบุ
    fs.writeFileSync(xmlPath, '﻿' + xml, { encoding: 'utf16le' });
    const res = runSchtasks(['/Create', '/F', '/TN', POWER_TASK_WAKE, '/XML', xmlPath]);
    return res;
  } finally {
    try { fs.unlinkSync(xmlPath); } catch { /* ignore */ }
  }
}

function applyPowerSchedule(schedule) {
  if (process.platform !== 'win32') {
    return { ok: false, error: 'รองรับเฉพาะระบบปฏิบัติการ Windows เท่านั้น' };
  }
  const off = applyShutdownTask(schedule);
  const wake = applyWakeTask(schedule);

  const errors = [];
  if (schedule.offEnabled && !off.ok) {
    errors.push(`ตั้งเวลาปิดเครื่องไม่สำเร็จ: ${off.stderr || off.error || ('exit ' + off.code)}`);
  }
  if (schedule.onEnabled && !wake.ok) {
    errors.push(`ตั้งเวลาเปิดเครื่องไม่สำเร็จ: ${wake.stderr || wake.error || ('exit ' + wake.code)}`);
  }

  if (errors.length) {
    const needAdmin = errors.some((e) => /denied|ปฏิเสธ|access|0x80070005/i.test(e));
    return {
      ok: false,
      error: errors.join(' | ') + (needAdmin ? ' (กรุณาเปิดโปรแกรมด้วยสิทธิ์ Administrator)' : ''),
    };
  }
  return { ok: true };
}

ipcMain.handle('power-schedule:get', () => {
  const schedule = getPowerSchedule();
  let status = { supported: process.platform === 'win32', shutdownTask: false, wakeTask: false };
  if (status.supported) {
    status.shutdownTask = scheduledTaskExists(POWER_TASK_SHUTDOWN);
    status.wakeTask = scheduledTaskExists(POWER_TASK_WAKE);
  }
  return { schedule, status };
});

ipcMain.handle('power-schedule:set', (event, payload) => {
  const schedule = normalizePowerSchedule(payload);
  store.set(POWER_SCHEDULE_KEY, schedule);
  const result = applyPowerSchedule(schedule);
  return { ...result, schedule };
});

// ทดสอบ/ดูตัวอย่างคำสั่งปิดเครื่อง (ไม่สั่งปิดจริง — แค่ส่งคืนคำสั่ง)
ipcMain.handle('power-schedule:preview-off', () => {
  return { command: buildOffCommand(getPowerSchedule()) };
});

function stopLocalServer() {
  if (!localServerProcess || localServerProcess.killed) return;

  try {
    localServerProcess.kill();
  } catch (error) {
    console.log(`Unable to stop local server: ${error.message}`);
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    startHealthCheck();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('before-quit', () => {
  isQuitting = true; // อนุญาตให้ปิดโปรแกรมจริงได้ แม้กำลังล็อกหน้าชำระเงินอยู่
  closeCustomerDisplay();
  clearUnresponsiveReloadTimer();
  stopHealthCheck();
  stopPrintAgent();
  stopLanBridge().catch(() => undefined);
  stopLocalServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});