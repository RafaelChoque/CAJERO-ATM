import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '../../utils/alerts';
import { ShieldCheck, Lock } from 'lucide-react';

const CambiarPasswordMovil = () => {
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [idUsuario, setIdUsuario] = useState(null);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const tempId = localStorage.getItem('temp_userId');
        if (!tempId) navigate('/movil/login', { replace: true });
        else setIdUsuario(tempId);
    }, [navigate]);

    const handleSubmit = async (e) => {
            e.preventDefault();
            if (password !== confirmPassword) return showError("Las contraseñas no coinciden");

            try {
                setCargando(true);

                const res = await fetch(`/api/auth/cambiar-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idUsuario: parseInt(idUsuario),
                        nuevaPassword: password
                    })
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.message || "Fallo al actualizar la contraseña");

                showSuccess("Seguridad Actualizada", data.message || "Cuenta activada correctamente.");
                localStorage.removeItem('temp_userId');
                setTimeout(() => navigate('/movil/login'), 2000);

            } catch (error) {
                console.error("Error en la petición:", error);
                showError(error.message || "Error de conexión con el banco");
            } finally {
                setCargando(false);
            }
        };

    return (
        <section className="min-h-screen bg-white sm:bg-gray-200 sm:flex sm:items-center sm:justify-center sm:p-4 font-sans">
            <div className="w-full h-screen sm:w-[360px] sm:h-[700px] sm:rounded-[3rem] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl bg-white relative overflow-hidden flex flex-col">

                <div className="hidden sm:block absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-40 mx-auto z-50"></div>

                <div className="bg-[#003366] pt-14 pb-8 px-8 text-center rounded-b-[40px] shadow-lg">
                    <div className="bg-yellow-400 text-[#003366] w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight">Primer Ingreso</h1>
                    <p className="text-blue-200 text-xs mt-2">Establece tu nueva contraseña personal BISA.</p>
                </div>

                <div className="flex-1 p-8 flex flex-col justify-center bg-gray-50/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-[#004a8e] uppercase ml-1">Nueva Contraseña</label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="password" required className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f5d000]" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[#004a8e] uppercase ml-1">Confirmar</label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="password" required className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f5d000]" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                        </div>
                        <button type="submit" disabled={cargando} className="w-full bg-[#004a8e] text-white font-black uppercase py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                            {cargando ? 'Guardando...' : 'Activar Cuenta'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default CambiarPasswordMovil;