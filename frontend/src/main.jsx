import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e1e34',
            color: '#e2e8f0',
            border: '1px solid #3a3a62',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1e1e34' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1e1e34' }
          }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
