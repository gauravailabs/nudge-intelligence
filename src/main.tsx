import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// NOTE: React.StrictMode intentionally removed. In dev it double-invokes effects,
// which disconnected/reconnected the IntersectionObservers driving the slide
// fade-in animations and left whole sections stuck at opacity:0 (blank page).
const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in index.html')
ReactDOM.createRoot(rootEl).render(<App />)
