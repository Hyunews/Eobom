import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// mkcert로 생성한 로컬 인증서가 있으면 HTTPS로, 없으면 HTTP로 — 인증서는 기기별로
// 직접 생성하는 gitignore 대상이라(eobom/.certs/), 없는 환경에서도 dev 서버가 죽지 않게 한다.
// 인증서 없을 시 위치(Geolocation) API가 동작 안 하는 이유는 README/systems.md 참고.
// package.json이 "type": "module"이라 __dirname이 없어 import.meta.url로 대체.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certDir = path.resolve(__dirname, '../.certs')
const certPath = path.join(certDir, 'localhost+2.pem')
const keyPath = path.join(certDir, 'localhost+2-key.pem')
const httpsConfig =
  fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
    : undefined

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    https: httpsConfig
  }
})
