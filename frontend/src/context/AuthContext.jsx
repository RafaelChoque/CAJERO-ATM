import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const API_URL ='';
    const [clientUser, setClientUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token_bisa');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    setUser({ username: decoded.sub, rol: decoded.role || 'ADMINISTRADOR' });
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('token_bisa');
                }
            } catch (error) {
                localStorage.removeItem('token_bisa');
            }
        }

        const tokenCliente = localStorage.getItem('token_cliente');
        const dataCliente = localStorage.getItem('cliente_auth');
        if (tokenCliente && dataCliente) {
            try {
                setClientUser(JSON.parse(dataCliente));
            } catch (error) {
                localStorage.removeItem('token_cliente');
                localStorage.removeItem('cliente_auth');
            }
        }

        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombreUsuario: username, contrasena: password })
            });

            if (!response.ok) throw new Error("Credenciales inválidas");

            const data = await response.json();

            localStorage.setItem('token_bisa', data.token);

            const decoded = jwtDecode(data.token);
            setUser({ username: decoded.sub, rol: decoded.role || 'ADMINISTRADOR' });
            setIsAuthenticated(true);

            return { success: true, redirect: data.redirect };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token_bisa');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/', { replace: true });
    };

    const iniciarSesionCliente = (dataCliente, token) => {
        localStorage.setItem('token_cliente', token);
        localStorage.setItem('cliente_auth', JSON.stringify(dataCliente));
        setClientUser(dataCliente);
    };

    const cerrarSesionCliente = () => {
        localStorage.removeItem('token_cliente');
        localStorage.removeItem('cliente_auth');
        setClientUser(null);
        navigate('/movil/login', { replace: true });
    };

    const apiCall = async (endpoint, options = {}) => {
        const token = localStorage.getItem('token_bisa');
        const tokenCliente = localStorage.getItem('token_cliente');

        const tokenUsar = token || tokenCliente;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (tokenUsar) {
            headers['Authorization'] = `Bearer ${tokenUsar}`;
        }

        const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

        try {
            const response = await fetch(`${API_URL}${safeEndpoint}`, {
                ...options,
                headers
            });

            if (response.status === 401 || response.status === 403) {
                if (location.pathname.includes('/movil')) {
                    cerrarSesionCliente();
                    throw new Error('Tu sesión ha expirado por seguridad. Vuelve a ingresar.');
                }
                else if (location.pathname !== '/') {
                    logout();
                    throw new Error('Sesión de administrador expirada.');
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, apiCall, isAuthenticated, loading,
            clientUser, iniciarSesionCliente, cerrarSesionCliente
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);