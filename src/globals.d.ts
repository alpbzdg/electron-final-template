export {}

declare global {
  interface Window {
    ipcRenderer: import('electron').IpcRenderer
    authAPI: {
      setToken: (token: string) => Promise<void>
      getToken: () => Promise<string | null>
      clearToken: () => Promise<void>
    }
    electronAPI: {
      openMainWindow: () => void,
      logout: () => void,
      closeApp: () => void,
      windowControl: (action: 'minimize' | 'maximize' | 'close') => void
    }
  }
}
