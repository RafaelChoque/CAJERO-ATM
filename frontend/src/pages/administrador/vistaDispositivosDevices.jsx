import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess, confirmAction } from '../../utils/alerts';
import { Smartphone, Lock, Unlock, RefreshCw, Search, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const VistaDispositivosDevices = () => {
    const { apiCall } = useAuth();
    const [dispositivos, setDispositivos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtro, setFiltro] = useState('todos'); // todos, bloqueados, activos

    useEffect(() => {
        cargarDispositivos();
    }, []);

    const cargarDispositivos = async () => {
        try {
            setCargando(true);
            const response = await apiCall('/api/admin/dispositivos/listar');
            if (!response.ok) throw new Error("Error al cargar dispositivos");
            const data = await response.json();
            setDispositivos(data);
        } catch (err) {
            showError("Error", "No se pudieron cargar los dispositivos");
        } finally {
            setCargando(false);
        }
    };

    const bloquearDispositivo = async (idDispositivo, nombreCliente) => {
        const confirmado = await confirmAction({
            title: '¿Bloquear Dispositivo?',
            text: `El dispositivo de ${nombreCliente} será bloqueado. El usuario no podrá iniciar sesión desde este dispositivo.`,
            confirmText: 'Sí, bloquear',
            isDestructive: true
        });

        if (!confirmado) return;

        try {
            const res = await apiCall(`/api/admin/dispositivos/bloquear/${idDispositivo}`, { method: 'POST' });
            if (!res.ok) throw new Error("Error al bloquear dispositivo");
            showSuccess('Dispositivo Bloqueado', `Se bloqueó el acceso del dispositivo de ${nombreCliente}.`);
            cargarDispositivos();
        } catch (err) {
            showError("Error", err.message || "No se pudo bloquear el dispositivo");
        }
    };

    const desbloquearDispositivo = async (idDispositivo, nombreCliente) => {
        const confirmado = await confirmAction({
            title: '¿Desbloquear Dispositivo?',
            text: `Se permitirá que ${nombreCliente} vuelva a usar este dispositivo. Se generará un nuevo ID de dispositivo.`,
            confirmText: 'Sí, desbloquear'
        });

        if (!confirmado) return;

        try {
            const res = await apiCall(`/api/admin/dispositivos/desbloquear/${idDispositivo}`, { method: 'POST' });
            if (!res.ok) throw new Error("Error al desbloquear dispositivo");
            showSuccess('Dispositivo Desbloqueado', `Se regeneró el dispositivo para ${nombreCliente}.`);
            cargarDispositivos();
        } catch (err) {
            showError("Error", err.message || "No se pudo desbloquear el dispositivo");
        }
    };

    const eliminarRegistroDispositivo = async (idDispositivo) => {
        const confirmado = await confirmAction({
            title: '¿Eliminar Registro?',
            text: 'Se eliminará permanentemente el registro de este dispositivo de la base de datos.',
            confirmText: 'Sí, eliminar',
            isDestructive: true
        });

        if (!confirmado) return;

        try {
            const res = await apiCall(`/api/admin/dispositivos/eliminar/${idDispositivo}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Error al eliminar");
            showSuccess('Registro Eliminado', 'Se removió el dispositivo de la base de datos.');
            cargarDispositivos();
        } catch (err) {
            showError("Error", "No se pudo eliminar el registro");
        }
    };

    const filtrados = dispositivos.filter(d => {
        const nombreArmado = `${d.nombreUsuario} ${d.apellidoPaterno}`.toLowerCase();
        const coincideNombre = nombreArmado.includes(searchTerm.toLowerCase()) || d.ci?.includes(searchTerm);
        const coincideFiltro =
            filtro === 'todos' ||
            (filtro === 'bloqueados' && d.estaBloqueado) ||
            (filtro === 'activos' && !d.estaBloqueado);
        return coincideNombre && coincideFiltro;
    });

    return (
        <section className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans antialiased">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* cabecera principal */}
                <header className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#004a8e] p-3 rounded-xl shadow-lg"><Smartphone className="text-white" size={28} /></div>
                        <div>
                            <h1 className="text-2xl font-black text-[#004a8e] uppercase tracking-tight">Gestión de Dispositivos</h1>
                            <p className="text-gray-500 text-sm font-medium">Control de acceso por dispositivo perdido o robado</p>
                        </div>
                    </div>
                    <button onClick={cargarDispositivos} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#004a8e] px-6 py-3 rounded-xl font-black transition-all shadow-sm active:scale-95 uppercase tracking-wider text-sm">
                        <RefreshCw size={20} /> Actualizar
                    </button>
                </header>

                {/* buscador y filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Buscar por nombre o CI..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5d000] outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['todos', 'activos', 'bloqueados'].map((f) => (
                            <button key={f} onClick={() => setFiltro(f)} className={`px-4 py-2 rounded-lg font-bold text-sm uppercase transition-all ${filtro === f ? 'bg-[#004a8e] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {f === 'todos' ? 'Todos' : f === 'activos' ? 'Activos' : 'Bloqueados'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* tabla de dispositivos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">ID Dispositivo</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">Último Login</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {cargando ? (
                                <tr><td colSpan="5" className="text-center py-10 font-bold text-gray-400">Cargando dispositivos...</td></tr>
                            ) : filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-16">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <Smartphone size={48} className="text-[#004a8e]" />
                                            <p className="font-black uppercase tracking-widest text-sm text-[#004a8e]">No hay dispositivos</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtrados.map((dispositivo) => (
                                    <tr key={dispositivo.idDispositivo} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#004a8e] font-black group-hover:bg-[#004a8e] group-hover:text-white transition-all shadow-sm uppercase">
                                                    {dispositivo.nombreUsuario?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 leading-tight">
                                                        {`${dispositivo.nombreUsuario} ${dispositivo.apellidoPaterno}`}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-gray-500 uppercase">CI: {dispositivo.ci}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-middle">
                                            <code className="text-xs bg-gray-100 px-2.5 py-1.5 rounded-lg font-mono text-gray-700 block max-w-xs truncate">
                                                {dispositivo.dispositivoId}
                                            </code>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                                            {dispositivo.estaBloqueado ? (
                                                <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded text-[10px] font-black uppercase border border-red-100">
                                                        <Lock size={12} /> Bloqueado
                                                    </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded text-[10px] font-black uppercase border border-green-100">
                                                        <CheckCircle size={12} /> Activo
                                                    </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap align-middle text-sm text-gray-600">
                                            {dispositivo.ultimoLogin ? new Date(dispositivo.ultimoLogin).toLocaleDateString('es-ES') : 'Nunca'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                                            <div className="flex items-center gap-2">
                                                {dispositivo.esActual && (
                                                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-[9px] font-black uppercase">
                                                        ⭐ ACTUAL
                                                    </span>
                                                )}
                                                <code className="text-xs bg-gray-100 px-2.5 py-1.5 rounded-lg font-mono text-gray-700 block max-w-xs truncate">
                                                    {dispositivo.dispositivoId}
                                                </code>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                                            <div className="flex items-center justify-center gap-2">
                                                {dispositivo.estaBloqueado ? (
                                                    <button
                                                        onClick={() => desbloquearDispositivo(dispositivo.idDispositivo, dispositivo.nombreUsuario)}
                                                        className="p-1.5 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-md transition-all"
                                                        title="Desbloquear y regenerar"
                                                    >
                                                        <Unlock size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => bloquearDispositivo(dispositivo.idDispositivo, dispositivo.nombreUsuario)}
                                                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-md transition-all"
                                                        title="Bloquear dispositivo"
                                                    >
                                                        <Lock size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => eliminarRegistroDispositivo(dispositivo.idDispositivo)}
                                                    className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-600 hover:text-white rounded-md transition-all"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VistaDispositivosDevices;