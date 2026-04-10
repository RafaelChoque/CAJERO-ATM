import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess, confirmAction } from '../../utils/alerts';
import { Server, MapPin, Activity, Plus, X, Search, Edit2, Map, Maximize, Minimize } from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position === null ? null : <Marker position={position}></Marker>;
};

const MapResizer = ({ isExpanded }) => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }, [map, isExpanded]);
    return null;
};

const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

const VistaCajeros = () => {
    const { apiCall } = useAuth();
    const [cajeros, setCajeros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [showNetworkMap, setShowNetworkMap] = useState(false);

    const defaultCenter = { lat: -16.489689, lng: -68.119293 };
    const [networkMapCenter, setNetworkMapCenter] = useState(defaultCenter);
    const [networkMapZoom, setNetworkMapZoom] = useState(13);

    const initialFormState = { idCajero: null, codigoCajero: '', ubicacion: '', direccionIp: '', latitud: '', longitud: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [mapPosition, setMapPosition] = useState(null);

    useEffect(() => {
        cargarCajeros();
    }, []);

    const cargarCajeros = async () => {
        try {
            setCargando(true);
            const response = await apiCall('/api/admin/cajeros/listar');
            if (!response.ok) throw new Error("Error al cargar la red de ATMs");
            const data = await response.json();
            setCajeros(data);
        } catch (error) {
            showError("No se pudo conectar con el Core Bancario BISA.");
        } finally {
            setCargando(false);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData(initialFormState);
        setMapPosition(null);
        setIsMapExpanded(false);
        setShowModal(true);
    };

    const openEditModal = (cajero) => {
        setIsEditing(true);
        setFormData({
            idCajero: cajero.idCajero,
            codigoCajero: cajero.codigoCajero,
            ubicacion: cajero.ubicacion,
            direccionIp: cajero.direccionIp,
            latitud: cajero.latitud || '',
            longitud: cajero.longitud || ''
        });

        if (cajero.latitud && cajero.longitud) {
            setMapPosition({ lat: parseFloat(cajero.latitud), lng: parseFloat(cajero.longitud) });
        } else {
            setMapPosition(null);
        }

        setIsMapExpanded(false);
        setShowModal(true);
    };

    const verCajeroEnMapa = (cajero) => {
        if (cajero.latitud && cajero.longitud) {
            setNetworkMapCenter({ lat: parseFloat(cajero.latitud), lng: parseFloat(cajero.longitud) });
            setNetworkMapZoom(17);
            setShowNetworkMap(true);
        } else {
            showError("Este cajero no tiene coordenadas registradas en el mapa.");
        }
    };

    const abrirMapaGlobal = () => {
        setNetworkMapCenter(defaultCenter);
        setNetworkMapZoom(13);
        setShowNetworkMap(true);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleMapClick = (pos) => {
        setMapPosition(pos);
        setFormData({
            ...formData,
            latitud: pos.lat.toString(),
            longitud: pos.lng.toString()
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.latitud || !formData.longitud || formData.latitud === '') {
            return showError("Por favor, haga clic en el mapa para marcar la ubicación.");
        }

        try {
            const url = isEditing ? `/api/admin/cajeros/actualizar/${formData.idCajero}` : '/api/admin/cajeros/registrar';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await apiCall(url, {
                method: method,
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Error al procesar la información del ATM.");

            showSuccess(
                isEditing ? 'ATM Actualizado' : 'ATM Registrado',
                isEditing ? `Los datos de <b>${formData.codigoCajero}</b> se guardaron.` : `La terminal <b>${formData.codigoCajero}</b> fue vinculada.`
            );

            setShowModal(false);
            setFormData(initialFormState);
            cargarCajeros();
        } catch (error) {
            showError(error.message);
        }
    };

    const toggleEstado = async (idCajero, estadoActual, codigoCajero) => {
        const esActivo = estadoActual === 'ACTIVO';
        const nuevoEstado = esActivo ? 'MANTENIMIENTO' : 'ACTIVO';

        const confirmado = await confirmAction({
            title: esActivo ? '¿Suspender ATM?' : '¿Activar ATM?',
            text: esActivo ? `La terminal ${codigoCajero} dejará de recibir clientes.` : `La terminal ${codigoCajero} volverá a estar en línea.`,
            confirmText: esActivo ? 'Sí, suspender' : 'Sí, activar',
            isDestructive: esActivo
        });

        if (!confirmado) return;

        try {
            const res = await apiCall(`/api/admin/cajeros/estado/${idCajero}/${nuevoEstado}`, { method: 'POST' });
            if (!res.ok) throw new Error("Error al comunicar el cambio de estado.");
            showSuccess('Estado Actualizado', `La terminal ahora está en <b>${nuevoEstado}</b>.`);
            cargarCajeros();
        } catch (error) {
            showError("No se pudo cambiar el estado del cajero.");
        }
    };


    const cajerosFiltrados = cajeros.filter(c =>
        c.codigoCajero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="p-4 sm:p-8 font-sans bg-gray-50 min-h-screen antialiased">
            <div className="max-w-7xl mx-auto space-y-6">

                <header className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#004a8e] p-3 rounded-xl shadow-lg"><Server className="text-white" size={28} /></div>
                        <div>
                            <h1 className="text-2xl font-black text-[#004a8e] uppercase tracking-tight">Red de Cajeros</h1>
                            <p className="text-gray-500 text-sm font-medium">Gestión de Terminales Físicas</p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={abrirMapaGlobal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-[#004a8e] text-[#004a8e] hover:bg-blue-50 px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95">
                            <Map size={20} /> Mapa Red
                        </button>
                        <button onClick={openCreateModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#004a8e] hover:bg-[#003566] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95">
                            <Plus size={20} /> Nuevo ATM
                        </button>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5d000] outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">Identificador</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">Ubicación</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {cargando ? (
                                <tr><td colSpan="4" className="text-center py-10 font-bold text-gray-400">Sincronizando </td></tr>
                            ) : cajerosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-16">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <Server size={48} className="text-[#004a8e]" />
                                            <p className="font-black uppercase tracking-widest text-sm text-[#004a8e]">No hay cajeros registrados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                cajerosFiltrados.map((cajero) => (
                                    <tr key={cajero.idCajero} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{cajero.codigoCajero}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">IP: {cajero.direccionIp}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            <MapPin size={14} className="inline mr-1 text-[#004a8e]" />{cajero.ubicacion}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${cajero.estado === 'ACTIVO' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                {cajero.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-end gap-3">
                                            <button onClick={() => verCajeroEnMapa(cajero)} className="p-1.5 text-teal-600 bg-teal-50 hover:bg-teal-600 hover:text-white rounded-md transition-all shadow-sm" title="Ver Ubicación">
                                                <MapPin size={16} />
                                            </button>
                                            <button onClick={() => openEditModal(cajero)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-md transition-all shadow-sm" title="Editar Cajero">
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => toggleEstado(cajero.idCajero, cajero.estado, cajero.codigoCajero)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#004a8e] focus:ring-offset-1 ${cajero.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${cajero.estado === 'ACTIVO' ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showNetworkMap && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B263B]/90 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200">
                    <div className="bg-white w-full h-full max-w-7xl rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                        <div className="absolute top-0 w-full z-[400] flex justify-between items-center p-4 pointer-events-none">
                            <div className="bg-[#004a8e] text-white px-6 py-3 rounded-xl shadow-lg pointer-events-auto border border-blue-400/30">
                                <h2 className="text-lg font-black tracking-widest uppercase flex items-center gap-2">
                                    <MapPin size={20} className="text-[#f5d000]" /> Ubicación ATM
                                </h2>
                            </div>
                            <button onClick={() => setShowNetworkMap(false)} className="bg-white text-gray-800 hover:text-red-500 hover:bg-red-50 p-3 rounded-full shadow-lg pointer-events-auto transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 w-full h-full z-10">
                            <MapContainer center={networkMapCenter} zoom={networkMapZoom} style={{ height: '100%', width: '100%' }}>
                                <ChangeView center={networkMapCenter} zoom={networkMapZoom} />
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap'
                                />
                                {cajeros.filter(c => c.latitud && c.longitud).map((cajero) => (
                                    <Marker key={cajero.idCajero} position={[parseFloat(cajero.latitud), parseFloat(cajero.longitud)]}>
                                        <Popup>
                                            <div className="text-center">
                                                <strong className="text-[#004a8e] text-sm block border-b pb-1 mb-1">{cajero.codigoCajero}</strong>
                                                <span className="text-xs text-gray-600 block">{cajero.ubicacion}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${cajero.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {cajero.estado}
                                                </span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1B263B]/60 backdrop-blur-sm">
                    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 transition-all ${isMapExpanded ? 'w-full h-full max-w-none' : 'w-full max-w-5xl'}`}>
                        <div className={`w-full md:w-5/12 p-6 flex flex-col bg-gray-50 border-r border-gray-100 ${isMapExpanded ? 'hidden' : 'flex'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-[#004a8e] uppercase tracking-tight">
                                        {isEditing ? 'Configurar ATM' : 'Nueva Terminal'}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">Complete los datos y marque el mapa</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="md:hidden text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Código Identificador</label><input type="text" name="codigoCajero" required disabled={isEditing} value={formData.codigoCajero} onChange={handleChange} className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none transition-all ${isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20'}`} /></div>
                                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ubicación Física</label><input type="text" name="ubicacion" required value={formData.ubicacion} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 transition-all" /></div>
                                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Dirección IP (LAN)</label><input type="text" name="direccionIp" required value={formData.direccionIp} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#f5d000] focus:ring-2 focus:ring-[#f5d000]/20 font-mono text-sm transition-all" /></div>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div className="bg-white p-2 rounded-lg border border-gray-200"><span className="block text-[10px] font-bold text-gray-400 uppercase">Latitud</span><span className="text-sm font-mono text-[#004a8e]">{formData.latitud || '---'}</span></div>
                                    <div className="bg-white p-2 rounded-lg border border-gray-200"><span className="block text-[10px] font-bold text-gray-400 uppercase">Longitud</span><span className="text-sm font-mono text-[#004a8e]">{formData.longitud || '---'}</span></div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Cancelar</button>
                                    <button type="submit" className="px-5 py-2.5 bg-[#004a8e] text-white rounded-xl font-black uppercase hover:bg-[#003566] transition-colors shadow-md">
                                        {isEditing ? 'Guardar Cambios' : 'Vincular ATM'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className={`relative bg-gray-200 ${isMapExpanded ? 'w-full h-full' : 'w-full md:w-7/12 min-h-[450px]'}`}>
                            {!isMapExpanded && (
                                <button onClick={() => setShowModal(false)} className="hidden md:flex absolute top-4 right-4 z-[400] bg-white text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-2 shadow-lg transition-colors items-center justify-center"><X size={20} /></button>
                            )}
                            <button type="button" onClick={(e) => { e.preventDefault(); setIsMapExpanded(!isMapExpanded); }} className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-blue-200 flex items-center gap-2 text-xs font-bold text-[#004a8e] hover:bg-blue-50 transition-colors cursor-pointer">
                                {isMapExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
                                {isMapExpanded ? 'Minimizar Mapa' : 'Pantalla Completa'}
                            </button>
                            <div className="absolute bottom-6 left-4 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-md border border-blue-100 pointer-events-none">
                                <p className="text-xs font-bold text-[#004a8e] flex items-center gap-1"><MapPin size={14} className="text-[#f5d000]"/> Haz clic para ubicar</p>
                            </div>
                            {isMapExpanded && (
                                <div className="absolute bottom-6 right-6 z-[400]">
                                    <button type="button" onClick={(e) => { e.preventDefault(); setIsMapExpanded(false); }} className="bg-[#004a8e] text-white px-6 py-3 rounded-xl font-black shadow-xl hover:bg-[#003566] transition-all flex items-center gap-2 border-2 border-white/20">
                                        <MapPin size={18} /> Confirmar Ubicación
                                    </button>
                                </div>
                            )}
                            <MapContainer center={mapPosition || defaultCenter} zoom={14} style={{ height: '100%', width: '100%', zIndex: 10 }}>
                                <MapResizer isExpanded={isMapExpanded} />
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                <LocationMarker position={mapPosition} setPosition={handleMapClick} />
                            </MapContainer>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default VistaCajeros;