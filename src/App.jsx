import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './hooks/useAuth.jsx'
import { ToastProvider } from './hooks/useToast.jsx'
import Navbar        from './components/Navbar.jsx'
import AuthModal     from './components/AuthModal.jsx'
import Home          from './pages/Home.jsx'
import Donors        from './pages/Donors.jsx'
import EmergencyBoard from './pages/EmergencyBoard.jsx'
import RequestBlood  from './pages/RequestBlood.jsx'
import Ambulance     from './pages/Ambulance.jsx'
import Addambulance  from './pages/Addambulance.jsx'
import RegisterDonor from './pages/RegisterDonor.jsx'
import Profile       from './pages/Profile.jsx'

function AppShell() {
  return (
    <div className="min-h-screen bg-[#eef2f2]">
      <Navbar />
      <AuthModal />
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/donors"          element={<Donors />} />
        <Route path="/emergency"       element={<EmergencyBoard />} />
        <Route path="/request-blood"   element={<RequestBlood />} />
        <Route path="/ambulance"       element={<Ambulance />} />
        <Route path="/add-ambulance"   element={<Addambulance />} />
        <Route path="/register-donor"  element={<RegisterDonor />} />
        <Route path="/profile"         element={<Profile />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}