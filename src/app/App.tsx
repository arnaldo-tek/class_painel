import { RouterProvider } from '@tanstack/react-router'
import { AuthProvider } from '@/contexts/AuthContext'
import { router } from '@/router'
import { Toaster } from 'sonner'

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  )
}
