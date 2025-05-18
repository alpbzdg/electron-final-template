// preload/index.mjs
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Bu map, orijinal renderer listener'larını ve onlara karşılık gelen
// sarmalanmış (wrapped) preload listener'larını tutacak.
// Yapı: Map<channel, Map<originalListener, wrappedListener>>
const allListeners = new Map<string, Map<Function, (event: IpcRendererEvent, ...args: any[]) => void>>();

contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel: string, listener: (...args: any[]) => void) => {
    if (typeof channel !== 'string' || typeof listener !== 'function') {
      console.error('ipcRenderer.on: channel must be a string and listener must be a function.');
      return;
    }

    if (!allListeners.has(channel)) {
      allListeners.set(channel, new Map());
    }

    const channelListeners = allListeners.get(channel)!;

    // Aynı listener'ın tekrar eklenmesini engelle (isteğe bağlı ama iyi bir pratik)
    if (channelListeners.has(listener)) {
      console.warn(`ipcRenderer.on: Listener already registered for channel "${channel}".`);
      return;
    }

    const wrappedListener = (_event: IpcRendererEvent, ...args: any[]) => listener(...args);
    channelListeners.set(listener, wrappedListener);
    ipcRenderer.on(channel, wrappedListener);
  },

  off: (channel: string, listener: (...args: any[]) => void) => {
    if (typeof channel !== 'string' || typeof listener !== 'function') {
      console.error('ipcRenderer.off: channel must be a string and listener must be a function.');
      return;
    }

    const channelListeners = allListeners.get(channel);
    if (channelListeners) {
      const wrappedListener = channelListeners.get(listener);
      if (wrappedListener) {
        ipcRenderer.removeListener(channel, wrappedListener);
        channelListeners.delete(listener);
        if (channelListeners.size === 0) {
          allListeners.delete(channel);
        }
      }
    }
  },

  removeAllListeners: (channel: string) => {
    if (typeof channel !== 'string') {
      console.error('ipcRenderer.removeAllListeners: channel must be a string.');
      return;
    }
    // Öncelikle kendi takip ettiğimiz listener'ları temizleyelim
    const channelListeners = allListeners.get(channel);
    if (channelListeners) {
      for (const wrappedListener of channelListeners.values()) {
        ipcRenderer.removeListener(channel, wrappedListener);
      }
      allListeners.delete(channel);
    }
    // Sonra Electron'un kendi metodunu çağıralım (opsiyonel, ama tam temizlik için iyi olabilir)
    // Ancak dikkat: Bu, preload dışında (main process'te) aynı kanala eklenmiş
    // diğer listener'ları etkilemez, sadece bu renderer process'in ipcRenderer'ı üzerinden eklenenleri.
    // Genellikle yukarıdaki temizlik yeterli olacaktır.
    // ipcRenderer.removeAllListeners(channel);
  },

  send: (channel: string, ...args: any[]) => {
    if (typeof channel !== 'string') {
      console.error('ipcRenderer.send: channel must be a string.');
      return;
    }
    ipcRenderer.send(channel, ...args);
  },

  invoke: (channel: string, ...args: any[]) => {
    if (typeof channel !== 'string') {
      console.error('ipcRenderer.invoke: channel must be a string.');
      return Promise.reject(new Error('Channel must be a string.'));
    }
    return ipcRenderer.invoke(channel, ...args);
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  openMainWindow: () => ipcRenderer.send('open-main-window'),
  logout: () => ipcRenderer.send('logout'),
  closeApp: () => ipcRenderer.send('app-quit'),
  windowControl: (action: 'minimize' | 'maximize' | 'close') => ipcRenderer.send('window-control', action),
});

contextBridge.exposeInMainWorld('authAPI', {
  setToken: (token: string) => ipcRenderer.invoke('auth:setToken', token),
  getToken: () => ipcRenderer.invoke('auth:getToken'),
  clearToken: () => ipcRenderer.invoke('auth:clearToken'),
});

contextBridge.exposeInMainWorld('appAPI', {
  getVersion: () => ipcRenderer.invoke('get-app-version')
})

contextBridge.exposeInMainWorld('updateAPI', {
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  startDownload: () => ipcRenderer.invoke('start-download'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),

  // Renderer tarafı `window.ipcRenderer.on('update-can-available', ...)` vb. kullanacak.
  // Bu nedenle aşağıdaki özel event handler sarmalayıcılarına gerek yok.
  /*
  onUpdateAvailable: (cb: (info: any) => void) => ipcRenderer.on('update-can-available', (_e, data) => cb(data)),
  onDownloadProgress: (cb: (progress: any) => void) => ipcRenderer.on('download-progress', (_e, data) => cb(data)),
  onDownloaded: (cb: () => void) => ipcRenderer.on('update-downloaded', cb),
  onUpdateError: (cb: (error: any) => void) => ipcRenderer.on('update-error', (_e, err) => cb(err)),
  */
});