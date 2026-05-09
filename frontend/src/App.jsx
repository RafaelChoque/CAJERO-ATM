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

import OperadorDashboard from './pages/operadorETV/operador';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* RUTAS DEL CAJERO (ATM) */}
                    <Route path="/atm" element={<AtmInterface />} />

                    {/* LOGIN ÚNICO PARA STAFF (ADMINISTRADORES Y ETV) */}
                    <Route path="/admin/login" element={<Login />} />

                    {/* RUTAS PROTEGIDAS DEL ADMINISTRADOR */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'administrador']} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    </Route>

                    {/* RUTAS PROTEGIDAS DEL OPERADOR ETV */}
                    <Route element={<ProtectedRoute allowedRoles={['OPERADOR_ETV']} />}>
                        {/* ATENCIÓN: Se mantiene /etv/dashboard para que coincida con el redireccionamiento del backend */}
                        <Route path="/etv/dashboard" element={<OperadorDashboard />} />
                    </Route>

                    {/* RUTAS DE LA APP MÓVIL */}
                    <Route path="/movil/login" element={<MobileLogin />} />
                    <Route path="/movil/cambiar-password" element={<CambiarPasswordMovil />} />
                    <Route element={<ProtectedRoute allowedRoles={['CLIENTE', 'cliente']} />}>
                        <Route path="/movil/dashboard" element={<MobileDashboard />} />
                    </Route>

                    {/* REDIRECCIÓN POR DEFECTO SI LA RUTA NO EXISTE */}
                    <Route path="*" element={<Navigate to="/atm" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;