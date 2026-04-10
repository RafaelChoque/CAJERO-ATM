import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react'; // Añadimos Eye y EyeOff
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoBisa from '../assets/logo-bisa.png';

const LoginAdmin = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false); // Añadimos estado de carga
    const [mostrarPassword, setMostrarPassword] = useState(false); // Estado para el ojo
    const navigate = useNavigate();

    const { login } = useAuth();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true); // Iniciamos la animación del botón

        const result = await login(credentials.username, credentials.password);

        if (result.success) {
            navigate('/admin/dashboard');
        } else {
            setError('Acceso denegado: Credenciales inválidas o servidor apagado');
            setCargando(false); // Detenemos la animación si hay error
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-b from-[#003366] to-[#001a33] flex items-center justify-center p-6 antialiased font-sans">
            {/* Usamos un contenedor tipo "cristal" oscuro (glassmorphism) para que combine con el fondo */}
            <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 relative overflow-hidden">

                <div className="text-center mb-10">
                    <div className="mb-6 h-16 flex items-center justify-center">
                        <img
                            src={logoBisa}
                            alt="Banco BISA"
                            className="h-full object-contain drop-shadow-xl"
                        />
                    </div>

                    {/* La linea amarilla decorativa debajo del titulo igual que en móvil */}
                    <p className="text-blue-200 text-sm tracking-[0.3em] uppercase font-bold mb-2 relative inline-block">
                        Administrador
                        <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#f5d000] rounded-full"></span>
                    </p>
                    <p className="text-blue-200/50 text-[10px] font-bold tracking-widest mt-6 uppercase">Panel de Control LAN</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 w-full">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-blue-200 font-bold uppercase ml-2 tracking-wider">Usuario Administrador</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f5d000]" size={20} />
                            <input
                                name="username"
                                type="text"
                                required
                                value={credentials.username}
                                onChange={handleChange}
                                className="w-full bg-white/10 border border-white/20 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#f5d000] focus:bg-white/20 transition-all placeholder:text-blue-200/50"
                                placeholder="Ingrese su usuario"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] text-blue-200 font-bold uppercase ml-2 tracking-wider">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f5d000]" size={20} />
                            <input
                                name="password"
                                type={mostrarPassword ? "text" : "password"}
                                required
                                value={credentials.password}
                                onChange={handleChange}
                                className="w-full bg-white/10 border border-white/20 text-white rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#f5d000] focus:bg-white/20 transition-all placeholder:text-blue-200/50 tracking-wider"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors p-1"
                            >
                                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 text-red-200 p-3 rounded-2xl text-xs font-bold text-center border border-red-500/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-[#f5d000] text-[#002244] font-black uppercase py-4 rounded-2xl shadow-[0_10px_20px_rgba(245,208,0,0.2)] mt-8 active:scale-95 transition-all tracking-widest text-sm flex items-center justify-center"
                    >
                        {cargando ? (
                            <span className="animate-spin text-xl">↻</span>
                        ) : (
                            'Iniciar Sesion'
                        )}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default LoginAdmin;