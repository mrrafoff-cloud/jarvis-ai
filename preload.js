const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("neurix", {
  openApp: appId => ipcRenderer.invoke("neurix:open-app", appId),
  openUrl: url => ipcRenderer.invoke("neurix:open-url", url),
  platform: () => ipcRenderer.invoke("neurix:platform"),
  fishStatus: () => ipcRenderer.invoke("neurix:fish-status"),
  saveFishApiKey: key => ipcRenderer.invoke("neurix:fish-save-key", key),
  fishTts: text => ipcRenderer.invoke("neurix:fish-tts", text)
});
