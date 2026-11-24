const { app, BrowserWindow, ipcMain, shell, session, safeStorage } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { execFile } = require("node:child_process");

const FISH_VOICE_ID = "05b36da8574341d0803391491850db20";
const FISH_KEY_FILE = () => path.join(app.getPath("userData"), "fish-api-key.enc");
async function readFishApiKey() {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    const encrypted = await fs.readFile(FISH_KEY_FILE());
    return safeStorage.decryptString(encrypted);
  } catch { return null; }
}

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180, height: 780, minWidth: 760, minHeight: 620,
    backgroundColor: "#070b14", title: "NEURIX", show: false, autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true, autoplayPolicy: "no-user-gesture-required"
    }
  });
  mainWindow.loadFile("index.html");
  mainWindow.once("ready-to-show", () => mainWindow.show());
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(permission === "media"));
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

const allowedApps = {
  calculator: { mac: "Calculator", win: "calc.exe" },
  notes: { mac: "Notes", win: "notepad.exe" }
};
ipcMain.handle("neurix:open-app", async (_event, appId) => {
  const target = allowedApps[appId];
  if (!target) return { ok: false, error: "Esa aplicación todavía no está en la lista compatible." };
  try {
    if (process.platform === "darwin") {
      await new Promise((resolve, reject) => execFile("open", ["-a", target.mac], err => err ? reject(err) : resolve()));
    } else if (process.platform === "win32") {
      await new Promise((resolve, reject) => execFile(target.win, [], err => err ? reject(err) : resolve()));
    } else return { ok: false, error: "Esta versión está preparada para macOS y Windows." };
    return { ok: true };
  } catch { return { ok: false, error: "No se ha podido abrir esa aplicación en este ordenador." }; }
});
ipcMain.handle("neurix:open-url", async (_event, rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Protocolo no permitido");
    await shell.openExternal(parsed.toString());
    return { ok: true };
  } catch { return { ok: false, error: "No se ha podido abrir ese enlace." }; }
});
ipcMain.handle("neurix:platform", () => process.platform);


ipcMain.handle("neurix:fish-status", async () => {
  try {
    if (!safeStorage.isEncryptionAvailable()) return { configured: false, secureStorage: false };
    await fs.access(FISH_KEY_FILE());
    return { configured: true, secureStorage: true };
  } catch { return { configured: false, secureStorage: safeStorage.isEncryptionAvailable() }; }
});

ipcMain.handle("neurix:fish-save-key", async (_event, rawKey) => {
  const key = typeof rawKey === "string" ? rawKey.trim() : "";
  if (key.length < 20 || key.length > 500) return { ok: false, error: "La API key no parece válida." };
  if (!safeStorage.isEncryptionAvailable()) return { ok: false, error: "El almacenamiento seguro no está disponible en este ordenador." };
  try {
    await fs.mkdir(app.getPath("userData"), { recursive: true });
    await fs.writeFile(FISH_KEY_FILE(), safeStorage.encryptString(key), { mode: 0o600 });
    return { ok: true };
  } catch { return { ok: false, error: "No se ha podido guardar la clave de forma segura." }; }
});

ipcMain.handle("neurix:fish-tts", async (_event, rawText) => {
  const text = typeof rawText === "string" ? rawText.trim().slice(0, 4000) : "";
  if (!text) return { ok: false, error: "No hay texto para convertir." };
  const apiKey = await readFishApiKey();
  if (!apiKey) return { ok: false, error: "Configura tu API key de Fish Audio en Ajustes." };
  try {
    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "model": "s2.1-pro-free"
      },
      body: JSON.stringify({ text, reference_id: FISH_VOICE_ID, format: "mp3" })
    });
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).message || ""; } catch {}
      const messages = {
        401: "Fish Audio ha rechazado la API key. Comprueba que sea la nueva clave.",
        402: "La cuenta de Fish Audio no tiene crédito disponible para este modelo.",
        404: "Fish Audio no encuentra ese Voice ID.",
        429: "Fish Audio está recibiendo demasiadas peticiones. Inténtalo más tarde."
      };
      return { ok: false, error: messages[response.status] || detail || `Error de Fish Audio (${response.status}).` };
    }
    const audio = Buffer.from(await response.arrayBuffer());
    return { ok: true, audio: audio.toString("base64"), mimeType: "audio/mpeg" };
  } catch {
    return { ok: false, error: "No se ha podido conectar con Fish Audio. Revisa tu conexión." };
  }
});
