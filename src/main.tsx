/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
// Application entry point
createRoot(document.getElementById('root')!).render(<App />)
