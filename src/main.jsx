import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'
import { initializeLibrary } from './lib/localLibrary.js'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

initializeLibrary()
  .then(() => {
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </React.StrictMode>,
    )
  })
  .catch((err) => {
    console.error('Failed to initialize library:', err)
    root.render(<div>Failed to initialize Echo. Please refresh.</div>)
  })
