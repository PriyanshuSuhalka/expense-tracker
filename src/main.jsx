import React from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import { initDb } from './lib/db.js'
import './styles/tokens.css'
import './styles/app.css'

registerSW({ immediate: true })

initDb()
  .catch((e) => console.error('DB init failed', e))
  .finally(() => createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>))
