import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, clientUser, isAuthenticated, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Verificando seguridad...</div>;

    if (allowedRoles && (allowedRoles.includes('CLIENTE') || allowedRoles.includes('cliente'))) {
        if (!clientUser) {
            return <Navigate to="/movil/login" replace />;
        }
        return <Outlet />;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        return <Navigate to="/no-autorizado" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;