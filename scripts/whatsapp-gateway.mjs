/**
 * موعدكم — بوابة واتساب محلية (Baileys).
 * شغّلها بـ: npm run wa
 * تربط رقم صاحب المحل عبر QR وترسل تأكيد/إلغاء/تذكير حجز، وإشعار الطلب الجديد لصاحب المشروع.
 */
import { createServer } from "node:http";
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import pino from "pino";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SESSION_DIR = join(ROOT, ".wa-session");
const HOST = "127.0.0.1";
const PORT = Number(process.env.WA_GATEWAY_PORT || 3003);
const REMINDER_POLL_MS = Number(process.env.WA_REMINDER_POLL_MS || 45_000);

const baileys = await import("@whiskeysockets/baileys");
const makeWASocket = baileys.default ?? baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;

const log = pino({ level: process.env.WA_LOG || "info" });

/** @type {import('@whiskeysockets/baileys').WASocket | null} */
let sock = null;
let connecting = false;
let qrDataUrl = "";
let qrAt = 0;
let lastError = "";
let connectedPhone = "";

function normalizeIraq(input = "") {
  let digits = String(input).replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("964")) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `964${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 10) return `964${digits}`;
  return digits;
}

function toJid(input = "") {
  const n = normalizeIraq(input);
  if (!n || n.length < 11) return "";
  return `${n}@s.whatsapp.net`;
}

function senderPhone() {
  const id = sock?.user?.id || "";
  const base = id.split(":")[0] || "";
  return normalizeIraq(base) || base.replace(/[^\d]/g, "");
}

function nuboApiCandidates() {
  const env = String(process.env.NUBO_API_URL || "").trim().replace(/\/$/, "");
  return [...new Set([env, "http://127.0.0.1:3001", "http://127.0.0.1:3000"].filter(Boolean))];
}

let cachedNuboApi = "";

async function nuboFetch(path, init = {}) {
  if (!cachedNuboApi) {
    for (const base of nuboApiCandidates()) {
      try {
        const probe = await fetch(`${base}/api/bookings`, { signal: AbortSignal.timeout(2500) });
        const data = await probe.json().catch(() => ({}));
        if (probe.ok && data && Array.isArray(data.bookings)) {
          cachedNuboApi = base;
          log.info({ api: base }, "nubo api");
          break;
        }
      } catch {
        /* try next */
      }
    }
  }
  const base = cachedNuboApi || nuboApiCandidates()[0];
  return fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(5000),
  });
}

async function sendText(jid, text) {
  if (!isOpen() || !sock) {
    const err = new Error("واتساب مو متصل. امسح الكود من /whatsapp.");
    err.status = 409;
    throw err;
  }
  await sock.sendMessage(jid, { text });
}

async function reminderTick() {
  try {
    await nuboFetch("/api/bookings/reminders?deliver=1");
  } catch (err) {
    log.warn({ err: String(err?.message || err) }, "reminder poll failed");
  }
}

function isOpen() {
  return Boolean(sock?.user?.id);
}

function publicState() {
  return {
    ok: true,
    connected: isOpen(),
    phone: isOpen() ? senderPhone() : "",
    hasQr: Boolean(qrDataUrl) && !isOpen(),
    qrAt,
    error: lastError,
  };
}

async function clearSession() {
  await rm(SESSION_DIR, { recursive: true, force: true });
}

async function startSocket() {
  if (connecting) return;
  connecting = true;
  lastError = "";
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    let version;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch {
      version = undefined;
    }

    sock = makeWASocket({
      ...(version ? { version } : {}),
      auth: state,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 400, errorCorrectionLevel: "M" });
        qrAt = Date.now();
        connectedPhone = "";
        connecting = false;
        log.info("qr ready");
      }
      if (connection === "open") {
        qrDataUrl = "";
        connectedPhone = senderPhone();
        lastError = "";
        connecting = false;
        log.info({ phone: connectedPhone }, "whatsapp connected");
        setTimeout(() => reminderTick().catch(() => {}), 1500);
      }
      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        sock = null;
        connectedPhone = "";
        if (loggedOut) {
          qrDataUrl = "";
          lastError = "انفصل الحساب. امسح الكود من جديد.";
          await clearSession();
          connecting = false;
          setTimeout(() => startSocket().catch(() => {}), 400);
          return;
        }
        lastError = "انقطع الاتصال. نعيد المحاولة…";
        connecting = false;
        setTimeout(() => startSocket().catch(() => {}), 1500);
      }
    });
  } catch (err) {
    lastError = "ما قدرنا نفتح جلسة واتساب.";
    log.warn({ err: String(err?.message || err) }, "socket start failed");
    connecting = false;
    setTimeout(() => startSocket().catch(() => {}), 3000);
    return;
  }
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function json(res, status, body) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(raw),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(raw);
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const path = url.pathname;

  try {
    if (req.method === "GET" && (path === "/status" || path === "/")) {
      json(res, 200, publicState());
      return;
    }
    if (req.method === "GET" && path === "/qr") {
      json(res, 200, { ...publicState(), qr: isOpen() ? "" : qrDataUrl });
      return;
    }
    if (req.method === "POST" && path === "/logout") {
      try {
        if (sock) await sock.logout();
      } catch {
        /* already gone */
      }
      sock = null;
      qrDataUrl = "";
      connectedPhone = "";
      await clearSession();
      connecting = false;
      lastError = "";
      startSocket().catch(() => {});
      json(res, 200, { ok: true, connected: false });
      return;
    }
    if (req.method === "POST" && path === "/send") {
      const body = await readJson(req);
      const jid = toJid(body.phone || body.to);
      const text = String(body.text || "").trim();
      if (!jid || !text) {
        json(res, 400, { ok: false, error: "رقم أو نص ناقص." });
        return;
      }
      if (!isOpen() || !sock) {
        json(res, 409, { ok: false, error: "واتساب مو متصل. امسح الكود من /whatsapp.", jid, connected: false });
        return;
      }
      try {
        await sendText(jid, text);
      } catch (err) {
        const self = normalizeIraq(jid) && normalizeIraq(jid) === senderPhone();
        json(res, 500, {
          ok: false,
          jid,
          self,
          error: self
            ? "واتساب رفض الإرسال لنفس الرقم المربوط. حط «رقم إشعارات المدير» من ضبط الحجز."
            : String(err?.message || "فشل الإرسال على البوابة."),
        });
        return;
      }
      log.info({ jid, self: normalizeIraq(jid) === senderPhone() }, "sent");
      json(res, 200, { ok: true, jid, from: senderPhone(), self: normalizeIraq(jid) === senderPhone() });
      return;
    }
    json(res, 404, { ok: false, error: "not found" });
  } catch (err) {
    log.warn({ err: String(err?.message || err) }, "request failed");
    json(res, 500, { ok: false, error: "فشل الطلب على البوابة." });
  }
});

function recoverFromCrash(err) {
  const msg = String(err?.message || err);
  log.warn({ err: msg }, "uncaught — reconnecting");
  lastError = "انقطع الاتصال. نعيد المحاولة…";
  sock = null;
  connecting = false;
  setTimeout(() => startSocket().catch(() => {}), 1500);
}

process.on("uncaughtException", recoverFromCrash);
process.on("unhandledRejection", recoverFromCrash);

server.listen(PORT, HOST, () => {
  log.info({ url: `http://${HOST}:${PORT}`, reminderPollMs: REMINDER_POLL_MS }, "nubo whatsapp gateway");
  startSocket().catch((err) => {
    lastError = "فشل تشغيل البوابة.";
    log.warn({ err: String(err?.message || err) }, "initial start failed");
  });
  setTimeout(() => reminderTick().catch(() => {}), 4000);
  setInterval(() => reminderTick().catch(() => {}), REMINDER_POLL_MS);
});
