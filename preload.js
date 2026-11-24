const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("neurix", {
  openApp: appId => ipcRenderer.invoke("neurix:open-app", appId),
  openUrl: url => ipcRenderer.invoke("neurix:open-url", url),
  platform: () => ipcRenderer.invoke("neurix:platform")
});
