import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '../../utils/alerts';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import logoBisa from '../../assets/logo-bisa.png';
// 🚀 1. IMPORTAMOS EL CONTEXTO
import { useAuth } from '../../context/AuthContext';

const MobileLogin = () => {
    const navigate = useNavigate();

    // 🚀 2. SACAMOS LA FUNCIÓN DEL CONTEXTO
    const { iniciarSesionCliente } = useAuth();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setCargando(true);
            const response = await fetch(`/api/auth/login-cliente`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombreUsuario: formData.username,
                    contrasena: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Credenciales inválidas.");

            if (data.requiereCambio) {
                // El cambio temporal se queda en localStorage porque es una vista intermedia
                localStorage.setItem('temp_userId', data.idUsuario);
                navigate('/movil/cambiar-password');
            } else {

                // 🚀 3. USAMOS LA FUNCIÓN DEL CONTEXTO EN LUGAR DE LOCALSTORAGE DIRECTO
                const datosCliente = {
                    idCuenta: data.idCuenta,
                    nombre: data.nombre,
                    saldo: data.saldo,
                    moneda: data.moneda === 'BOB' ? 'Bs.' : '$us.'
                };

                // Esto le avisa a TODO React que el cliente entró, y guarda los tokens automáticamente
                iniciarSesionCliente(datosCliente, data.token);

                showSuccess('Acceso Autorizado', `Bienvenido, ${data.nombre}`);
                navigate('/movil/dashboard');
            }
        } catch (err) {
            showError("Acceso Denegado", err.message || "Error de conexión con el banco");

            if (err.message && err.message.toLowerCase().includes("bloqueada")) {
                setFormData({ username: '', password: '' });
            } else {
                setFormData({ ...formData, password: '' });
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <section className="min-h-[100dvh] bg-[#003366] md:bg-gray-200 md:flex md:items-center md:justify-center md:p-4 font-sans">
            <div className="w-full h-[100dvh] md:w-[360px] md:h-[700px] md:rounded-[3rem] md:border-[8px] md:border-slate-800 md:shadow-2xl bg-gradient-to-b from-[#003366] to-[#001a33] relative overflow-hidden flex flex-col">

                <div className="hidden md:block absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-40 mx-auto z-50"></div>

                <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 w-full max-w-sm mx-auto">
                    <div className="mb-6 w-48 h-20 flex items-center justify-center">
                        <img
                            src={logoBisa}
                            alt="Logo Banco BISA"
                            className="w-full h-full object-contain drop-shadow-xl"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <h1 style={{display: 'none'}} className="text-5xl font-black text-white italic tracking-tighter drop-shadow-xl">BISA</h1>
                    </div>

                    <p className="text-blue-200 text-xs tracking-[0.3em] uppercase font-bold mb-10 text-center relative">
                        Banca Móvil
                        <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#f5d000] rounded-full"></span>
                    </p>

                    <form onSubmit={handleSubmit} className="w-full space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-blue-200 font-bold uppercase ml-2 tracking-wider">CI del Cliente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f5d000]" size={20} />
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-white/10 border border-white/20 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#f5d000] focus:bg-white/20 transition-all placeholder:text-blue-200/50"
                                    placeholder="Ingrese su carnet"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] text-blue-200 font-bold uppercase ml-2 tracking-wider">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f5d000]" size={20} />
                                <input
                                    type={mostrarPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    value={formData.password}
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

                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full bg-[#f5d000] text-[#002244] font-black uppercase py-4 rounded-2xl shadow-[0_10px_20px_rgba(245,208,0,0.2)] mt-8 active:scale-95 transition-all tracking-widest text-sm flex items-center justify-center"
                        >
                            {cargando ? (
                                <span className="animate-spin text-xl">↻</span>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>
                </div>
                <div className="hidden md:block h-1 bg-white/20 w-32 mx-auto rounded-full mb-4 shrink-0"></div>
            </div>
        </section>
    );
};

export default MobileLogin;