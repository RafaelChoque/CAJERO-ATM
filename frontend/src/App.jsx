import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/login';
import AdminDashboard from './pages/administrador/administrador';
import AtmInterface from './pages/atm/AtmInterface';

import MobileLogin from './pages/Movil/MobileLogin';
import CambiarPasswordMovil from './pages/Movil/CambiarPasswordMovil';
import MobileDashboard from './pages/Movil/MobileDashboard';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* RUTAS DEL CAJERO (ATM) */}
                    <Route path="/atm" element={<AtmInterface />} />

                    {/* RUTAS DEL ADMINISTRADOR */}
                    <Route path="/admin/login" element={<Login />} />
                    <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'administrador']} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    </Route>

                    {/* RUTAS DE LA APP MÓVIL */}
                    <Route path="/movil/login" element={<MobileLogin />} />
                    <Route path="/movil/cambiar-password" element={<CambiarPasswordMovil />} />
                    <Route element={<ProtectedRoute allowedRoles={['CLIENTE', 'cliente']} />}>
                        <Route path="/movil/dashboard" element={<MobileDashboard />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/atm" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;