import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, clientUser, isAuthenticated, loading } = useAuth();

    if (loading) return <div className="...">Verificando seguridad...</div>;

    if (allowedRoles.some(role => ['CLIENTE', 'cliente'].includes(role))) {
        if (!clientUser) return <Navigate to="/movil/login" replace />;
        return <Outlet />;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/admin/login" replace />; // Centraliza el login de admin aquí
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        return <Navigate to="/no-autorizado" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;