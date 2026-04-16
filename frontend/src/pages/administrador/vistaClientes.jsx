import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess, confirmAction } from '../../utils/alerts';
import { ShieldAlert, CheckCircle, Smartphone, Mail, Search, UserCheck, ShieldCheck, UserPlus, X, Edit2, Lock } from 'lucide-react';

const VistaClientes = () => {
    const { apiCall } = useAuth();
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const initialFormState = {
        idUsuario: null,
        nombre: '', apellidoPaterno: '', apellidoMaterno: '',
        ci: '', celular: '', correoElectronico: '',
        fechaNacimiento: '', direccion: '',
        saldoInicial: '', pinCajero: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            setCargando(true);
            const response = await apiCall('/api/admin/clientes/listar');
            if (!response.ok) throw new Error("Error al cargar clientes");
            const data = await response.json();
            setClientes(data);
        } catch (err) {
            showError("Error de conexión con el Core Bancario.");
        } finally {
            setCargando(false);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData(initialFormState);
        setShowModal(true);
    };

    const openEditModal = (cliente) => {
        setIsEditing(true);
        setFormData({
            idUsuario: cliente.idUsuario,
            nombre: cliente.nombre || '',
            apellidoPaterno: cliente.apellidoPaterno || '',
            apellidoMaterno: cliente.apellidoMaterno || '',
            ci: cliente.ci,
            celular: cliente.celular || '',
            correoElectronico: cliente.correo || '',
            direccion: '',
        });
        setShowModal(true);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isEditing ? `/api/admin/clientes/actualizar/${formData.idUsuario}` : '/api/admin/clientes/registrar';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = isEditing ? {
                nombre: formData.nombre,
                apellidoPaterno: formData.apellidoPaterno,
                apellidoMaterno: formData.apellidoMaterno,
                celular: formData.celular,
                correoElectronico: formData.correoElectronico,
                direccion: formData.direccion
            } : formData;

            const res = await apiCall(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Error al procesar la información del cliente.");

            showSuccess(
                isEditing ? 'Cliente Actualizado' : 'Afiliación Exitosa',
                isEditing ? `Los datos de contacto fueron actualizados.` : `El cliente ha sido registrado y su cuenta creada.`
            );

            setShowModal(false);
            cargarClientes();
        } catch (err) {
            showError(err.message);
        }
    };

    const toggleEstadoSeguridad = async (idUsuario, estadoActual, nombreCliente) => {
        const esActivo = estadoActual === 'ACTIVO';
        const nuevoEstado = esActivo ? 'BLOQUEADO' : 'ACTIVO';

        const verificado = await confirmAction({
            title: esActivo ? '¿Suspender Acceso?' : '¿Restaurar Acceso?',
            text: esActivo
                ? `El cliente ${nombreCliente} no podrá usar la App Móvil ni realizar retiros Cardless.`
                : `Se restaurará el acceso de ${nombreCliente} a la plataforma.`,
            confirmText: esActivo ? 'Sí, suspender' : 'Sí, restaurar',
            isDestructive: esActivo
        });

        if (!verificado) return;

        try {
            const res = await apiCall(`/api/admin/clientes/estado/${idUsuario}/${nuevoEstado}`, { method: 'POST' });
            if (!res.ok) throw new Error("Error al cambiar el estado de seguridad.");
            showSuccess('Seguridad Actualizada', `El estado ahora es <b>${nuevoEstado}</b>.`);
            cargarClientes();
        } catch (err) {
            showError("No se pudo cambiar el estado del cliente.");
        }
    };

    const filtrados = clientes.filter(c => {
        const nombreArmado = `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`.toLowerCase();
        return nombreArmado.includes(searchTerm.toLowerCase()) || c.ci?.includes(searchTerm);
    });


    return (
        <section className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans antialiased">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* cabecera principal con titulo y botones */}
                <header className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#004a8e] p-3 rounded-xl shadow-lg"><ShieldCheck className="text-white" size={28} /></div>
                        <div>
                            <h1 className="text-2xl font-black text-[#004a8e] uppercase tracking-tight">Cartera de Clientes</h1>
                            <p className="text-gray-500 text-sm font-medium">Gestión y Seguridad de Accesos Cardless</p>
                        </div>
                    </div>
                    <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#f5d000] hover:bg-[#e6c200] text-[#004a8e] px-6 py-3 rounded-xl font-black transition-all shadow-md active:scale-95 uppercase tracking-wider text-sm">
                        <UserPlus size={20} /> Afiliar Cliente
                    </button>
                </header>
                {/* buscador */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Buscar por nombre o CI..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5d000] outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {/* tabla principal de clientes */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">Contacto Directo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider text-center">Alertas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cargando ? (
                                    <tr><td colSpan="4" className="text-center py-10 font-bold text-gray-400">Sincronizando...</td></tr>
                                ) : filtrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-16">
                                            <div className="flex flex-col items-center gap-2 opacity-40">
                                                <UserCheck size={48} className="text-[#004a8e]" />
                                                <p className="font-black uppercase tracking-widest text-sm text-[#004a8e]">No hay clientes registrados</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtrados.map((cliente) => (
                                        <tr key={cliente.idUsuario} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#004a8e] font-black group-hover:bg-[#004a8e] group-hover:text-white transition-all shadow-sm uppercase">
                                                        {cliente.nombre ? cliente.nombre.charAt(0) : 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-tight">
                                                            {`${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`}
                                                        </p>
                                                        <p className="text-[11px] font-mono text-gray-500 uppercase">CI: {cliente.ci}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                                        <Mail size={12} className="text-[#004a8e]" /> {cliente.correo}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                                        <Smartphone size={12} className="text-[#004a8e]" /> {cliente.celular}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                                                {cliente.estado === 'BLOQUEADO' ? (
                                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1 rounded text-[10px] font-black uppercase border border-gray-200">
                                                        <Lock size={12} /> Bloqueo Manual
                                                    </span>
                                                ) : cliente.intentosFallidos > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded text-[10px] font-black uppercase border border-red-100">
                                                        <ShieldAlert size={12} /> {cliente.intentosFallidos} Intentos
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase bg-green-50 px-3 py-1 rounded border border-green-100">
                                                        <CheckCircle size={12} /> Seguro
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${cliente.estado === 'ACTIVO' ? 'text-[#004a8e] bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                                                        {cliente.estado}
                                                    </span>

                                                    <button onClick={() => openEditModal(cliente)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-md transition-all">
                                                        <Edit2 size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => toggleEstadoSeguridad(cliente.idUsuario, cliente.estado, `${cliente.nombre} ${cliente.apellidoPaterno}`)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#004a8e] focus:ring-offset-1 ${cliente.estado === 'ACTIVO' ? 'bg-[#004a8e]' : 'bg-red-500'}`}
                                                        title={cliente.estado === 'ACTIVO' ? 'Suspender Acceso' : 'Restaurar Acceso'}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${cliente.estado === 'ACTIVO' ? 'translate-x-6' : 'translate-x-1'}`} />
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
            {/* modal de crear/editar cliente*/}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B263B]/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="bg-[#004a8e] p-5 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-black uppercase flex items-center gap-2">
                                    {isEditing ? <Edit2 size={20} className="text-[#f5d000]" /> : <UserPlus size={20} className="text-[#f5d000]" />}
                                    {isEditing ? 'Actualizar Contacto' : 'Afiliar Nuevo Cliente'}
                                </h2>
                                <p className="text-xs text-blue-200 mt-1 ml-7">
                                    {isEditing ? 'Edite los datos permitidos del cliente.' : 'Complete el formulario KYC para aperturar la cuenta.'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="hover:bg-blue-800 p-1.5 rounded-lg transition-colors"><X size={24} /></button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <form id="registroForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="col-span-1 md:col-span-2"><h3 className="text-[#004a8e] font-bold border-b pb-2 mb-2">Datos Personales</h3></div>

                                <div><label className="text-xs font-bold text-gray-500">Nombre</label><input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all" /></div>

                                <div><label className="text-xs font-bold text-gray-500">Apellido Paterno</label><input type="text" name="apellidoPaterno" required value={formData.apellidoPaterno} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all" /></div>

                                <div><label className="text-xs font-bold text-gray-500">Apellido Materno</label><input type="text" name="apellidoMaterno" required value={formData.apellidoMaterno} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all" /></div>

                                {!isEditing && (
                                    <>
                                        <div><label className="text-xs font-bold text-gray-500">Carnet (CI)</label><input type="text" name="ci" required value={formData.ci} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all font-mono" /></div>
                                        <div><label className="text-xs font-bold text-gray-500">Fecha Nacimiento</label><input type="date" name="fechaNacimiento" required value={formData.fechaNacimiento} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all" /></div>
                                    </>
                                )}

                                <div><label className="text-xs font-bold text-gray-500">Celular</label><input type="text" name="celular" required value={formData.celular} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all font-mono" /></div>

                                <div><label className="text-xs font-bold text-gray-500">Correo Electrónico</label><input type="email" name="correoElectronico" required value={formData.correoElectronico} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all" /></div>

                                <div className="col-span-1 md:col-span-2"><label className="text-xs font-bold text-gray-500">Dirección</label><input type="text" name="direccion" required value={formData.direccion} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all" /></div>

                                {!isEditing && (
                                    <>
                                        <div className="col-span-1 md:col-span-2 mt-4"><h3 className="text-[#004a8e] font-bold border-b pb-2 mb-2">Apertura de Cuenta</h3></div>
                                        <div><label className="text-xs font-bold text-gray-500">Saldo Inicial (Bs)</label><input type="number" name="saldoInicial" required value={formData.saldoInicial} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all font-mono" /></div>
                                        <div><label className="text-xs font-bold text-gray-500">PIN Cajero (4 dígitos)</label><input type="password" name="pinCajero" maxLength="4" required value={formData.pinCajero} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 tracking-[0.5em] font-black text-center" /></div>
                                    </>
                                )}
                            </form>
                        </div>
                        <div className="p-5 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button form="registroForm" type="submit" className="px-6 py-2.5 bg-[#004a8e] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#003566] transition-colors shadow-md">
                                {isEditing ? 'Guardar Cambios' : 'Registrar en Core'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default VistaClientes;