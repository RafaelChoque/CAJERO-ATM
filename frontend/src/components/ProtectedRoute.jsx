import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();

    //
    if (allowedRoles && (allowedRoles.includes('CLIENTE') || allowedRoles.includes('cliente'))) {
        const tokenCliente = localStorage.getItem('token_cliente');

        if (!tokenCliente) {
            return <Navigate to="/movil/login" replace />;
        }
        return <Outlet />;
    }


    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Verificando seguridad...</div>;

    if (!loading && !isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
        return <Navigate to="/no-autorizado" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;