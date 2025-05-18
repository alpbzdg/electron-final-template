import { useEffect, useState } from 'react'

const Update = () => {
    const [status, setStatus] = useState('Güncellemeler kontrol ediliyor...')
    const [progress, setProgress] = useState(0)
    const [hasUpdate, setHasUpdate] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        window.updateAPI.checkUpdate()

        const handleUpdateAvailable = (data: any) => {
            console.log('[Update Handler] data:', data)

            if (typeof data !== 'object' || data === null) {
            console.error('[Update UI] Geçersiz update-can-available verisi:', data)
            setStatus('Güncelleme bilgisi alınamadı.')
            return
            }

            if (data.update) {
            setHasUpdate(true)
            setStatus(`Yeni sürüm bulundu: v${data.newVersion}`)
            window.updateAPI.startDownload()
            } else {
            setStatus(`Uygulamanız güncel. (v${data.version})`)
            setTimeout(() => {
                window.electronAPI.openMainWindow()
                window.close()
            }, 2000)
            }
        }

        const handleProgress = (...args: any[]) => {
        const data = args[0]
        if (!data || typeof data.percent !== 'number') {
            console.warn('[Update UI] Geçersiz progress verisi:', data)
            return
        }

        setStatus('Güncelleme indiriliyor...')
        setProgress(Math.floor(data.percent))
        }

        const handleDownloaded = () => {
            setStatus('Güncelleme tamamlandı. Kurulum başlatılıyor...')
            setTimeout(() => {
            window.updateAPI.quitAndInstall()
            }, 1500)
        }

        const handleError = (err: any) => {
            const message =
            typeof err === 'object' && err !== null && 'message' in err
                ? err.message
                : 'Güncelleme sırasında bilinmeyen bir hata oluştu.'

            console.error('[Update UI] Hata yakalandı:', err)
            setError(message)
            setStatus('Güncelleme sırasında bir hata oluştu.')
        }

        // Dinleyiciler
        window.ipcRenderer.on('update-can-available', handleUpdateAvailable)
        window.ipcRenderer.on('download-progress', handleProgress)
        window.ipcRenderer.on('update-downloaded', handleDownloaded)
        window.ipcRenderer.on('update-error', handleError)

        // Temizlik
        return () => {
            window.ipcRenderer.off('update-can-available', handleUpdateAvailable)
            window.ipcRenderer.off('download-progress', handleProgress)
            window.ipcRenderer.off('update-downloaded', handleDownloaded)
            window.ipcRenderer.off('update-error', handleError)
        }
    }, [])


    return (
        <div className='d-flex flex-column flex-center h-100 bg-light'>
            <div className='text-center'>
                <h2 className='text-gray-800 fw-bolder mb-5'>{status}</h2>

                {error && (
                    <div className='alert alert-danger w-300px mx-auto'>
                        <strong>Hata:</strong> {error}
                    </div>
                )}

                {hasUpdate && !error && (
                    <div className='progress h-20px w-300px'>
                        <div
                            className='progress-bar bg-primary progress-bar-striped progress-bar-animated'
                            role='progressbar'
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Update
