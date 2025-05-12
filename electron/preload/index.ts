import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APIs you need here.
  // ...
})

contextBridge.exposeInMainWorld('electronAPI', {
  openMainWindow: () => ipcRenderer.send('open-main-window'),
  logout: () => ipcRenderer.send('logout'),
  closeApp: () => ipcRenderer.send('window-all-closed'),
  windowControl: (action: 'minimize' | 'maximize' | 'close') => ipcRenderer.send('window-control', action),
})

contextBridge.exposeInMainWorld('authAPI', {
  setToken: (token: string) => ipcRenderer.invoke('auth:setToken', token),
  getToken: () => ipcRenderer.invoke('auth:getToken'),
  clearToken: () => ipcRenderer.invoke('auth:clearToken'),
})

