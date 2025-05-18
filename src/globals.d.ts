// globals.d.ts
import type { IpcRendererEvent } from 'electron'; // IpcRendererEvent tipini import et

export {};

declare global {
  interface Window {
    // ipcRenderer için daha spesifik bir tip tanımlaması,
    // preload betiğinde expose ettiğiniz metodlara uygun olarak.
    ipcRenderer: {
      on: (channel: string, listener: (...args: any[]) => void) => void;
      off: (channel: string, listener: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      send: (channel: string, ...args: any[]) => void;
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>; // invoke için generic dönüş tipi
    };
    authAPI: {
      setToken: (token: string) => Promise<void>;
      getToken: () => Promise<string | null>;
      clearToken: () => Promise<void>;
    };
    electronAPI: {
      openMainWindow: () => void;
      logout: () => void;
      closeApp: () => void; // Eğer main process'te 'app-quit' gibi bir handler'ınız varsa.
      windowControl: (action: 'minimize' | 'maximize' | 'close') => void;
    };
    updateAPI: {
      checkUpdate: () => Promise<any>; // Daha spesifik bir dönüş tipi belirleyebilirsiniz (örn: UpdateCheckResult)
      startDownload: () => Promise<any>; // Belki void veya bir progress indicator'ı için Promise<void>
      quitAndInstall: () => void; // Bu genellikle bir şey döndürmez.
      // updateAPI üzerinden event dinleme metodları kaldırıldığı için bunlar da buradan kaldırılmalı.
      // Event'ler doğrudan window.ipcRenderer.on ile dinlenecek.
    };
  }
}