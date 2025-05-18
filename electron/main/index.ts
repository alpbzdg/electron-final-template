import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'
import { setToken, getToken, clearToken } from './auth'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

let mainWindow: BrowserWindow | null = null
let loginWindow: BrowserWindow | null = null
let updateWindow: BrowserWindow | null = null

// TOKEN API
ipcMain.handle('auth:setToken', (_, token) => setToken(token))
ipcMain.handle('auth:getToken', () => getToken())
ipcMain.handle('auth:clearToken', () => clearToken())

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// OPEN MAIN WINDOW FROM LOGIN
ipcMain.on('open-main-window', async () => {
  if (loginWindow) {
    loginWindow.close()
    loginWindow = null
  }

  if (updateWindow) {
    updateWindow.close()
    updateWindow = null
  }

  const token = await getToken()

  if (token) {
    await createMainWindow()
  } else {
    createLoginWindow()
  }
})


function createUpdateWindow():BrowserWindow {
  if (updateWindow) {
    updateWindow.focus()
    return updateWindow;
  }

  updateWindow = new BrowserWindow({
    width: 400,
    height: 250,
    resizable: false,
    frame: false,
    transparent: true,        
    hasShadow: true,          
    alwaysOnTop: true,
    center: true,
    show: false,              
    title: 'Update',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  updateWindow.once('ready-to-show', () => {
    updateWindow?.show()
  })

  updateWindow.on('closed', () => {
    updateWindow = null
  })

  if (VITE_DEV_SERVER_URL) {
    updateWindow.loadURL(`${VITE_DEV_SERVER_URL}/#/update`)
  } else {
    updateWindow.loadFile(indexHtml, { hash: 'update' })
  }

  return updateWindow
}


function createMainWindow() {

  mainWindow = new BrowserWindow({
    width:1600,
    height:900,
    title: 'Ana Sayfa',
    frame:false,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(indexHtml)
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

function createLoginWindow() {
  if (loginWindow) {
    loginWindow.focus()
    return loginWindow;
  }

  loginWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    resizable: false,
    frame: false,
    transparent: true,          
    hasShadow: true,             
    title: 'Login',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  loginWindow.on('closed', () => {
    loginWindow = null
  })

  if (VITE_DEV_SERVER_URL) {
    loginWindow.loadURL(`${VITE_DEV_SERVER_URL}/#/login`)
  } else {
    loginWindow.loadFile(indexHtml, { hash: 'login' })
  }
}

app.whenReady().then(async () => {
    const updateWin = createUpdateWindow()
    update(updateWin)
})

app.on('window-all-closed', () => {
  mainWindow = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createMainWindow()
  }
})

ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

ipcMain.on('logout', () => {
  clearToken()

  if (mainWindow) {
    mainWindow.close()
    mainWindow = null
  }

  if (!loginWindow) {
    createLoginWindow()
  } else {
    loginWindow.focus()
  }
})

ipcMain.on('window-all-closed', () => {
  mainWindow = null
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return

  switch (action) {
    case 'minimize':
      win.minimize()
      break
    case 'maximize':
      if (win.isMaximized()) win.unmaximize()
      else win.maximize()
      break
    case 'close':
      win.close()
      break
  }
})