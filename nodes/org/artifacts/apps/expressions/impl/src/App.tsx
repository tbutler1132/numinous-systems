import { ProfileProvider } from './context/ProfileContext'
import { ThemeProvider } from './context/ThemeContext'
import ExpressionsApp from './pages/ExpressionsApp'
import DevUsageOverlay from './components/DevUsageOverlay'

function App() {
  return (
    <ProfileProvider>
      <ThemeProvider>
        <ExpressionsApp />
        <DevUsageOverlay />
      </ThemeProvider>
    </ProfileProvider>
  )
}

export default App
