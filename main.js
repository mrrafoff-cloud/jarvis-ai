const { app, BrowserWindow, ipcMain, shell, session } = require("electron");
const path = require("node:path");
const { execFile } = require("node:child_process");

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180, height: 780, minWidth: 760, minHeight: 620,
    backgroundColor: "#070b14", title: "NEURIX", show: false, autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true
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
