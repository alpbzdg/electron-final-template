
import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../_metronic/helpers'

const AuthLayout = () => {

  const location = useLocation()
  console.log(location.pathname)

  useEffect(() => {
    if (location.pathname === '/auth') {
      document.body.classList.add('login-page')
    } else {
      document.body.classList.remove('login-page')
    }
  }, [location.pathname])

  return (
    <div className="rounded-2 bg-transparent" style={{ height: '100vh', borderRadius: '20px' }}>
      <div className="d-flex flex-column flex-lg-row h-100">
        <div className="d-flex flex-column align-items-center justify-content-center bg-primary text-white p-10 w-50" style={{ borderBottomLeftRadius: '20px' }}>
          <div className="mb-5">
            <span className="fs-2x fw-bolder">BAŞKENT ÜNİVERSİTESİ</span>
          </div>

          <img src="media/logos/auth-screen.png" alt="Logo" height={150} />
          <br />
          <div className="text-center">
            <h1 className="text-white fw-bold">Bilgi İşlem Daire Başkanlığı</h1>
          </div>
        </div>

        <div className="d-flex flex-column align-items-center justify-content-center p-10 w-50 app-default" style={{ borderBottomRightRadius: '20px' }}>


          <div className="w-100 mw-400px">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );

}

export { AuthLayout }
