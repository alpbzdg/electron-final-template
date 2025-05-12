import keytar from 'keytar'

const SERVICE = 'baskent-uygulama'
const ACCOUNT = 'jwtTest'

export async function setToken(token: string) {
  return keytar.setPassword(SERVICE, ACCOUNT, token)
}

export async function getToken() {
  return keytar.getPassword(SERVICE, ACCOUNT)
}

export async function clearToken() {
  return keytar.deletePassword(SERVICE, ACCOUNT)
}
