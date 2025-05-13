export const CustomTitleBar = () => {
    const handleMinimize = () => window.electronAPI.windowControl('minimize')
    const handleMaximize = () => window.electronAPI.windowControl('maximize')
    const handleClose = () => window.electronAPI.windowControl('close')

    return (
        <div
            className="d-flex align-items-center justify-content-between px-2 text-white"
            style={{
                WebkitAppRegion: 'drag', background: '#1f2020', padding: 4, zIndex: 9999, position: 'fixed', top: 0, width: '100%'
            } as React.CSSProperties}
        >
            {/* Sol: Başlık */}
            <div className="fw-semibold fs-6">Başkent Üniversitesi - Yönetim Bilgi Sistemi</div>

            {/* Sağ: Butonlar */}
            <div
                className="d-flex align-items-center gap-2 ms-auto"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                <button
                    onClick={handleMinimize}
                    className="btn btn-sm p-0 px-3 bg-transparent text-white kucult-btn"
                    style={{ border: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3c3c3c')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    title="Küçült"
                >
                    &minus;
                </button>

                <button
                    onClick={handleMaximize}
                    className="btn btn-sm p-0 px-3 bg-transparent text-white"
                    style={{ border: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3c3c3c')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    title="Büyüt"
                >
                    &#9633;
                </button>

                <button
                    onClick={handleClose}
                    className="btn btn-sm p-0 px-3 bg-transparent text-white bg-hover-danger"
                    style={{ border: 'none' }}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    title="Kapat"
                >
                    &times;
                </button>

            </div>
        </div>
    )
}
