import type { IpcRendererEvent } from 'electron'

export {}

declare global {
  interface Window {
    ipcRenderer: {
      on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
      off: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      send: (channel: string, ...args: any[]) => void;
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
    };

    authAPI: {
      setToken: (token: string) => Promise<void>;
      getToken: () => Promise<string | null>;
      clearToken: () => Promise<void>;
    };

    electronAPI: {
      openMainWindow: () => void;
      logout: () => void;
      closeApp: () => void;
      windowControl: (action: 'minimize' | 'maximize' | 'close') => void;
    };

    updateAPI: {
      checkUpdate: () => Promise<any>;
      startDownload: () => Promise<any>;
      quitAndInstall: () => void;
    };

    appAPI:{
      getVersion:() => Promise<any>;
    }
  }
}
