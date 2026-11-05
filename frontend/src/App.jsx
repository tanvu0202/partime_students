import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentProfilePage from './pages/StudentProfilePage';
import EmployerProfilePage from './pages/EmployerProfilePage';
import PlaceholderPage from './pages/PlaceholderPage';
import HomePage from './pages/HomePage';
import './App.css';

const SV = ['STUDENT'];
const NTD = ['EMPLOYER'];
const AD = ['ADMIN'];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/student/profile" element={<ProtectedRoute roles={SV}><StudentProfilePage /></ProtectedRoute>} />
            <Route path="/student/applications" element={<ProtectedRoute roles={SV}><PlaceholderPage title="Đơn ứng tuyển của tôi" sprint="Sprint 3 (Buổi 7)" /></ProtectedRoute>} />

            <Route path="/employer/profile" element={<ProtectedRoute roles={NTD}><EmployerProfilePage /></ProtectedRoute>} />
            <Route path="/employer/jobs" element={<ProtectedRoute roles={NTD}><PlaceholderPage title="Tin của tôi" sprint="Sprint 3 (Buổi 7)" /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute roles={AD}><PlaceholderPage title="Quản trị" sprint="Sprint 4 (Buổi 8)" /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
