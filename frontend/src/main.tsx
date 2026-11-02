import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// after App so these rules override leaflet.css (pulled in by MapView)
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
