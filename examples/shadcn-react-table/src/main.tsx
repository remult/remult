import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Toaster } from 'sonner'
import { TooltipProvider } from './components/ui/tooltip.tsx'
import DialogProvider from './components/dialog/dialog-context.tsx'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DialogProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
      <Toaster />
    </DialogProvider>
  </React.StrictMode>,
)
