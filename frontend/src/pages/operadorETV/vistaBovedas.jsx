import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../utils/alerts';
import { Server, MapPin, X, Search, Map, ChevronDown, ChevronUp, Upload, AlertTriangle, PackageOpen, ShieldCheck, Wifi } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

const VistaBovedas = () => {
    const { apiCall } = useAuth();

    const [cajeros, setCajeros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showNetworkMap, setShowNetworkMap] = useState(false);
    const defaultCenter = { lat: -16.489689, lng: -68.119293 };
    const [networkMapCenter, setNetworkMapCenter] = useState(defaultCenter);
    const [networkMapZoom, setNetworkMapZoom] = useState(13);

    const [expandedCajeroId, setExpandedCajeroId] = useState(null);
    const [casetasPorCajero, setCasetasPorCajero] = useState({});
    const [alertasStock, setAlertasStock] = useState({});
    const [cargandoCasetas, setCargandoCasetas] = useState(false);

    // Estado para mostrar visualmente que estamos conectados en tiempo real
    const [wsConectado, setWsConectado] = useState(false);

    const fileInputsRef = useRef({});
    const fileInputMasterRef = useRef({});
    const stompClientRef = useRef(null);

    useEffect(() => {
        cargarCajeros();
        conectarWebSocketGlobal();

        // Limpieza al salir de la pantalla
        return () => {
            if (stompClientRef.current) stompClientRef.current.disconnect();
        };
    }, []);

    // NUEVO: Lógica WebSocket para actualizar en tiempo real
    const conectarWebSocketGlobal = () => {
        const wsUrl = window.location.origin + '/ws-atm';
        const socket = new SockJS(wsUrl);
        const stompClient = Stomp.over(socket);

        stompClient.debug = null; // Ocultar logs de consola

        stompClient.connect({}, () => {
            stompClientRef.current = stompClient;
            setWsConectado(true);

            // Escuchamos el canal global de la red de cajeros
            stompClient.subscribe(`/topic/cajeros`, (mensaje) => {
                const data = JSON.parse(mensaje.body);

                if (data.accion === 'NUEVO_CAJERO' || data.accion === 'ACTUALIZACION') {
                    showSuccess("Actualización de Red", "Se detectó un cambio en la red de ATMs. Actualizando mapa y tabla.");
                    cargarCajeros(); // Recargamos silenciosamente los datos
                }
            });
        }, (err) => {
            console.error("Error de conexión WebSocket", err);
            setWsConectado(false);
        });
    };

    const cargarCajeros = async () => {
        try {
            setCargando(true);
            const response = await apiCall('/api/admin/cajeros/listar');
            if (!response.ok) throw new Error("Error al cargar la red de ATMs");
            const data = await response.json();
            setCajeros(data);
        } catch (error) {
            showError("No se pudo conectar con el Core Bancario.");
        } finally {
            setCargando(false);
        }
    };

    const verCajeroEnMapa = (cajero) => {
        if (cajero.latitud && cajero.longitud) {
            setNetworkMapCenter({ lat: parseFloat(cajero.latitud), lng: parseFloat(cajero.longitud) });
            setNetworkMapZoom(17);
            setShowNetworkMap(true);
        } else {
            showError("Este cajero no tiene coordenadas registradas.");
        }
    };

    const abrirMapaGlobal = () => {
        setNetworkMapCenter(defaultCenter);
        setNetworkMapZoom(13);
        setShowNetworkMap(true);
    };

    const toggleCasetas = async (idCajero) => {
        if (expandedCajeroId === idCajero) {
            setExpandedCajeroId(null);
            return;
        }
        try {
            setCargandoCasetas(true);
            setExpandedCajeroId(idCajero);

            const responseCasetas = await apiCall(`/api/admin/cajeros/${idCajero}/casetas`);
            if (responseCasetas.ok) {
                const dataCasetas = await responseCasetas.json();
                setCasetasPorCajero(prev => ({ ...prev, [idCajero]: dataCasetas }));
            }

            const responseAlertas = await apiCall(`/api/admin/alertas/stock-bajo/${idCajero}`);
            if (responseAlertas.ok) {
                const dataAlertas = await responseAlertas.json();
                const diccionarioAlertas = {};
                dataAlertas.forEach(alerta => { diccionarioAlertas[alerta.idCaseta] = alerta; });
                setAlertasStock(prev => ({ ...prev, [idCajero]: diccionarioAlertas }));
            }
        } catch (error) {
            showError("Error al cargar bóveda.");
        } finally {
            setCargandoCasetas(false);
        }
    };

    const abrirSelectorArchivo = (idCaseta) => {
        if (fileInputsRef.current[idCaseta]) fileInputsRef.current[idCaseta].click();
    };
    const abrirSelectorMaestro = (idCajero) => {
        if (fileInputMasterRef.current[idCajero]) fileInputMasterRef.current[idCajero].click();
    };

    const subirExcelCaseta = async (idCaseta, file) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append("archivo", file);
            const response = await apiCall(`/api/admin/casetas/${idCaseta}/cargar-billetes`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Error al cargar");
            }
            showSuccess("Carga exitosa", "Billetes inyectados a la caseta.");
            if (expandedCajeroId) {
                setExpandedCajeroId(null);
                setTimeout(() => toggleCasetas(expandedCajeroId), 100);
            }
        } catch (error) {
            showError(error.message);
        }
    };

    const subirRemesaMaestra = async (idCajero, file) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append("archivo", file);
            const response = await apiCall(`/api/admin/casetas/cajero/${idCajero}/cargar-remesa`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Error al cargar");
            }
            showSuccess("Bóveda Llenada", "Remesa procesada automáticamente.");
            if (expandedCajeroId) {
                setExpandedCajeroId(null);
                setTimeout(() => toggleCasetas(expandedCajeroId), 100);
            }
        } catch (error) {
            showError(error.message);
        }
    };

    const cajerosFiltrados = cajeros.filter(c =>
        c.codigoCajero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="p-4 sm:p-8 font-sans bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center relative overflow-hidden">
                    {/* Indicador de conexión en vivo */}
                    <div className="absolute top-0 right-0 bg-[#f5d000] text-[#004a8e] px-4 py-1 text-[10px] font-black uppercase rounded-bl-lg flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${wsConectado ? 'bg-green-600' : 'bg-red-600'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${wsConectado ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                        {wsConectado ? 'Core Conectado' : 'Reconectando...'}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-[#f5d000] p-3 rounded-xl shadow-md"><ShieldCheck className="text-[#004a8e]" size={28} /></div>
                        <div>
                            <h1 className="text-2xl font-black text-[#004a8e] uppercase tracking-tight">Logística ETV</h1>
                            <p className="text-gray-500 text-sm font-medium">Recarga y Control de Efectivo</p>
                        </div>
                    </div>
                    <button onClick={abrirMapaGlobal} className="mt-4 flex items-center gap-2 bg-white border-2 border-[#004a8e] text-[#004a8e] hover:bg-blue-50 px-6 py-3 rounded-xl font-bold transition-all shadow-sm">
                        <Map size={20} /> Mapa de Rutas
                    </button>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#f5d000]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar cajero para recargar..." />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">Identificador</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider">Ubicación</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider text-center">Estado del ATM</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#004a8e] uppercase tracking-wider text-right">Acciones ETV</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {cargando ? <tr><td colSpan="4" className="text-center py-10 font-bold text-gray-400">Sincronizando...</td></tr> : cajerosFiltrados.map(cajero => (
                                <React.Fragment key={cajero.idCajero}>
                                    <tr className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{cajero.codigoCajero}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600"><MapPin size={14} className="inline mr-1 text-[#004a8e]" />{cajero.ubicacion}</td>
                                        <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${cajero.estado === 'ACTIVO' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>{cajero.estado}</span></td>
                                        <td className="px-6 py-4 flex justify-end gap-3">
                                            <button onClick={() => toggleCasetas(cajero.idCajero)} className="p-2 text-white bg-[#004a8e] hover:bg-blue-800 rounded-lg flex items-center gap-2 font-bold text-xs uppercase shadow-sm">
                                                Abrir Bóveda {expandedCajeroId === cajero.idCajero ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            <button onClick={() => verCajeroEnMapa(cajero)} className="p-2 text-teal-600 bg-teal-50 hover:bg-teal-600 hover:text-white rounded-lg"><MapPin size={18} /></button>
                                        </td>
                                    </tr>
                                    {expandedCajeroId === cajero.idCajero && (
                                        <tr className="animate-in fade-in slide-in-from-top-2">
                                            <td colSpan="4" className="bg-gray-100 p-6 shadow-inner">
                                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                    <div className="p-4 border-b flex justify-between items-center bg-[#004a8e] text-white">
                                                        <h3 className="font-black uppercase flex items-center gap-2"><Server size={18} /> Casetas internas</h3>
                                                        <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} ref={(el) => (fileInputMasterRef.current[cajero.idCajero] = el)} onChange={(e) => { subirRemesaMaestra(cajero.idCajero, e.target.files[0]); e.target.value = ''; }} />
                                                        <button onClick={() => abrirSelectorMaestro(cajero.idCajero)} className="flex items-center gap-2 bg-[#f5d000] text-[#004a8e] px-4 py-2 rounded-lg font-black text-xs uppercase shadow-md hover:bg-yellow-400"><PackageOpen size={18} /> Recarga Maestra</button>
                                                    </div>
                                                    <div className="p-0">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 border-b">
                                                                <tr>
                                                                    <th className="px-5 py-3 text-left font-bold text-[#004a8e]">Corte</th>
                                                                    <th className="px-5 py-3 text-center font-bold text-[#004a8e]">Stock Físico</th>
                                                                    <th className="px-5 py-3 text-right font-bold text-[#004a8e]">Ingresar Billetes</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {casetasPorCajero[cajero.idCajero]?.map(caseta => {
                                                                    const alerta = alertasStock[cajero.idCajero]?.[caseta.idCaseta];
                                                                    return (
                                                                        <tr key={caseta.idCaseta} className="hover:bg-gray-50">
                                                                            <td className="px-5 py-4 font-black text-lg">Bs {caseta.denominacion}</td>
                                                                            <td className="px-5 py-4 text-center flex flex-col items-center">
                                                                                <span className={`text-xl font-black ${alerta ? 'text-red-600' : 'text-gray-800'}`}>{caseta.stockActual} / {caseta.capacidadMaxima}</span>
                                                                                {alerta && <div className="mt-2 bg-red-50 text-red-700 px-3 py-1 rounded border border-red-200 text-[10px] font-bold uppercase flex items-center gap-1"><AlertTriangle size={12}/> Sugerencia EOQ: {alerta.cantidadSugeridaEOQ}</div>}
                                                                            </td>
                                                                            <td className="px-5 py-4 text-right">
                                                                                <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} ref={(el) => (fileInputsRef.current[caseta.idCaseta] = el)} onChange={(e) => { subirExcelCaseta(caseta.idCaseta, e.target.files[0]); e.target.value = ''; }} />
                                                                                <button onClick={() => abrirSelectorArchivo(caseta.idCaseta)} className="bg-gray-100 hover:bg-blue-50 text-[#004a8e] border border-gray-300 px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 ml-auto transition-colors"><Upload size={16} /> Subir Excel</button>
                                                                            </td>
                                                                        </tr>
                                                                )})}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Mapa Global */}
            {showNetworkMap && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 p-4">
                    <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl relative overflow-hidden animate-in zoom-in-95">
                        <button onClick={() => setShowNetworkMap(false)} className="absolute top-4 right-4 z-[400] bg-white text-red-500 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><X size={24} /></button>
                        <MapContainer center={networkMapCenter} zoom={networkMapZoom} style={{ height: '100%', width: '100%' }}>
                            <ChangeView center={networkMapCenter} zoom={networkMapZoom} />
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                            {cajeros.filter(c => c.latitud).map((cajero) => (
                                <Marker key={cajero.idCajero} position={[parseFloat(cajero.latitud), parseFloat(cajero.longitud)]}>
                                    <Popup><b>{cajero.codigoCajero}</b><br/>{cajero.ubicacion}</Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            )}
        </section>
    );
};

export default VistaBovedas;