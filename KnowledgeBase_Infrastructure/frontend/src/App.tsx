import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Shell } from './components/Shell'
import { Login } from './routes/Login'
import { Dashboard } from './routes/Dashboard'
import { Chat } from './routes/Chat'
import { Documents } from './routes/Documents'
import { KnowledgeBase } from './routes/KnowledgeBase'
import { Workflows } from './routes/Workflows'
import { ConversationsPage } from './routes/Conversations'
import { SettingsPage } from './routes/Settings'
import { UsersPage } from './routes/Users'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Shell /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="chat" element={<Chat />} />
              <Route path="documents" element={<Documents />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="workflows" element={<Workflows />} />
              <Route path="conversations" element={<ConversationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Routes>
          <Toaster
            position="top-left"
            toastOptions={{
              style: {
                background: 'var(--surface-elevated)',
                border: '1px solid var(--outline)',
                color: 'var(--on-surface)',
                fontSize: '0.875rem',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
