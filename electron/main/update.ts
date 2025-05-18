import { app, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from 'electron-updater'

const { autoUpdater } = createRequire(import.meta.url)('electron-updater')

export function update(win: Electron.BrowserWindow) {
  // Genel ayarlar
  autoUpdater.autoDownload = false
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false

  console.log('[autoUpdater] Başlatıldı. Uygulama sürümü:', app.getVersion())

  // ---- Event Dinleyicileri ----
  autoUpdater.on('checking-for-update', () => {
    console.log('[autoUpdater] Güncellemeler kontrol ediliyor...')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log(`[autoUpdater] Yeni sürüm bulundu: ${info.version}`)
    win.webContents.send('update-can-available', {
      update: true,
      version: app.getVersion(),
      newVersion: info.version,
    })
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log('[autoUpdater] Güncelleme bulunamadı.')
    win.webContents.send('update-can-available', {
      update: false,
      version: app.getVersion(),
      newVersion: info.version,
    })
  })

  autoUpdater.on('error', (error: Error) => {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? error.message
        : 'Güncelleme hatası oluştu.'

    console.error('[autoUpdater] Hata oluştu:', error)
    win.webContents.send('update-error', { message, error })
  })

  // ---- IPC Handle'lar ----

  ipcMain.handle('check-update', async () => {
  if (!app.isPackaged) {
    const error = new Error('Bu özellik sadece paketli sürümlerde çalışır.')
    console.warn('[check-update] Geliştirme modunda atlandı.')
    return { message: error.message, error }
  }

  try {
    console.log('[check-update] Güncelleme kontrolü başlatılıyor...')
    await autoUpdater.checkForUpdates() // <-- BURADA
    return { ok: true }
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? error.message
        : 'Ağ hatası oluştu.'
    console.error('[check-update] Hata:', error)
    return { message, error }
  }
})


  ipcMain.handle('start-download', (event) => {
    console.log('[start-download] İndirme başlatıldı.')

    startDownload(
      (error, progressInfo) => {
        if (error) {
          const message =
            typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : 'Bilinmeyen indirme hatası oluştu.'

          console.error('[start-download] Hata:', error)
          event.sender.send('update-error', { message, error })
          return
        }

        const percent = progressInfo?.percent?.toFixed(2) ?? '0.00'
        console.log(`[start-download] İndirme ilerlemesi: %${percent}`)
        event.sender.send('download-progress', progressInfo)
      },
      () => {
        console.log('[start-download] İndirme tamamlandı.')
        event.sender.send('update-downloaded')
      }
    )
  })

  ipcMain.handle('quit-and-install', () => {
    console.log('[quit-and-install] Uygulama yeniden başlatılıyor...')
    autoUpdater.quitAndInstall(false, true)
  })
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void
) {
  const onProgress = (info: ProgressInfo) => {
    callback(null, info)
  }

  const onError = (error: Error) => {
    callback(error, null)
    cleanup()
  }

  const onDownloaded = (event: UpdateDownloadedEvent) => {
    complete(event)
    cleanup()
  }

  function cleanup() {
    autoUpdater.removeListener('download-progress', onProgress)
    autoUpdater.removeListener('error', onError)
    autoUpdater.removeListener('update-downloaded', onDownloaded)
  }

  // Bağlantıları kur
  autoUpdater.on('download-progress', onProgress)
  autoUpdater.once('error', onError)
  autoUpdater.once('update-downloaded', onDownloaded)

  console.log('[startDownload] İndirme işlemi başlatıldı...')
  autoUpdater.downloadUpdate()
}