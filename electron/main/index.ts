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

// TOKEN API
ipcMain.handle('auth:setToken', (_, token) => setToken(token))
ipcMain.handle('auth:getToken', () => getToken())
ipcMain.handle('auth:clearToken', () => clearToken())

// OPEN MAIN WINDOW FROM LOGIN
ipcMain.on('open-main-window', async () => {
  if (loginWindow) {
    loginWindow.close()
    loginWindow = null
  }
  await createMainWindow()
})

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

  update(mainWindow)
}

function createLoginWindow() {
  if (loginWindow) {
    loginWindow.focus()
    return
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
  const token = await getToken()
  if (token) {
    await createMainWindow()
  } else {
    createLoginWindow()
  }
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

  createLoginWindow()
})

ipcMain.on('window-all-closed', () => {
  mainWindow = null
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('window-control', (_, action) => {
  if (!mainWindow) return
  switch (action) {
    case 'minimize':
      mainWindow.minimize()
      break
    case 'maximize':
      if (mainWindow.isMaximized()) mainWindow.unmaximize()
      else mainWindow.maximize()
      break
    case 'close':
      mainWindow.close()
      break
  }
})
