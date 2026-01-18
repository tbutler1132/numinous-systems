import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext'
import { ThemeProvider } from './context/ThemeContext'
import Landing from './pages/Landing'
import ExpressionsApp from './pages/ExpressionsApp'
import DevUsageOverlay from './components/DevUsageOverlay'

function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/expressions/*" element={<ExpressionsApp />} />
          </Routes>
          <DevUsageOverlay />
        </ThemeProvider>
      </ProfileProvider>
    </BrowserRouter>
  )
}

export default App
