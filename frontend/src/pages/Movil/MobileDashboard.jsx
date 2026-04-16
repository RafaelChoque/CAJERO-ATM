import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess, confirmAction } from '../../utils/alerts';
import {
    Home, ArrowLeft, Smartphone, LogOut, MapPin,
    CreditCard, Eye, EyeOff, RefreshCw, Send, QrCode, FileText, Keyboard, Camera
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import DetectorBilletes from '../../components/DetectorBilletes';

import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


const CustomQrScanner = ({ onScanSuccess }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScanSuccess(decodedText);
            },
            (error) => {}
        );

        return () => {
            scanner.clear().catch(e => console.error(e));
        };
    }, [onScanSuccess]);

    return <div id="reader" className="w-full h-full object-cover"></div>;
};

const MobileDashboard = () => {
    const navigate = useNavigate();
    const { apiCall, cerrarSesionCliente } = useAuth();

    const [view, setView] = useState('home');
    const [clienteAuth, setClienteAuth] = useState(null);
    const [scannedCode, setScannedCode] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarIngresoManual, setMostrarIngresoManual] = useState(false);

    const [mostrarSaldo, setMostrarSaldo] = useState(true);
    const [cajerosUbicaciones, setCajerosUbicaciones] = useState([]);
    const [transacciones, setTransacciones] = useState([]);

    useEffect(() => {
        const dataStr = localStorage.getItem('cliente_auth');
        if (dataStr) {
            const cliente = JSON.parse(dataStr);
            setClienteAuth(cliente);
            cargarTransacciones(cliente.idCuenta);
            cargarCajerosMapa();
        }
    }, []);

    useEffect(() => {
        if (!clienteAuth) return;

        const wsUrl = window.location.origin + '/ws-atm';
        const socket = new SockJS(wsUrl);
        const stompClient = Stomp.over(socket);
        const dataStr = localStorage.getItem('cliente_auth');
        if (dataStr) {
            const cliente = JSON.parse(dataStr);
            setClienteAuth(cliente);
            cargarCuenta(cliente.idCuenta);
            cargarTransacciones(cliente.idCuenta);
            cargarCajerosMapa();
        }

        stompClient.debug = null;

        stompClient.connect({}, () => {
            stompClient.subscribe(`/topic/seguridad/${clienteAuth.idCuenta}`, async (mensaje) => {
                const data = JSON.parse(mensaje.body);

                if (data.accion === 'CERRAR_SESION') {
                    stompClient.disconnect();
                    showError("Bloqueo de Seguridad", data.motivo);
                    cerrarSesionCliente();
                    return;
                }

                if (data.accion === 'ACTUALIZAR_CUENTA') {
                    await refrescarDatosCliente(clienteAuth.idCuenta);
                }
            });
        }, (err) => {
            console.error("No se pudo conectar al canal de seguridad.", err);
        });

        return () => {
            if (stompClient.connected) stompClient.disconnect();
        };
    }, [clienteAuth?.idCuenta, cerrarSesionCliente]);

    const cargarCajerosMapa = async () => {
        try {
            const res = await apiCall(`/api/auth/cajeros-cercanos`);
            if (res.ok) setCajerosUbicaciones(await res.json());
        } catch (error) {
            console.error("No se pudo cargar el mapa de cajeros", error);
        }
    };

    const cargarTransacciones = async (idCuenta) => {
        try {
            const res = await apiCall(`/api/auth/movimientos/${idCuenta}`);
            if (res.ok) setTransacciones(await res.json());
        } catch (error) {
            console.error("No se pudieron cargar los movimientos", error);
            setTransacciones([]);
        }
    };

    const handleRefresh = () => {
        if (clienteAuth) {
            cargarCuenta(clienteAuth.idCuenta);
            cargarTransacciones(clienteAuth.idCuenta);
            showSuccess("Actualizado", "Tus datos han sido sincronizados.");
        }
    };

    const handleLogout = async () => {
        const confirmar = await confirmAction({
            title: '¿Cerrar Sesión?',
            text: 'Saldrás de tu cuenta de Banca Móvil.',
            confirmText: 'Sí, salir'
        });

        if (confirmar) {
             cerrarSesionCliente();
        }
    };

    const procesarVinculacion = async (codigo) => {
        if (!codigo || cargando) return;

        try {
            setCargando(true);

            const response = await apiCall(`/api/qr/vincular`, {
                method: 'POST',
                body: JSON.stringify({
                    codigoToken: codigo,
                    idCuenta: clienteAuth.idCuenta
                })
            });

            if (!response.ok) throw new Error("Código inválido o expirado.");

            showSuccess('¡Conectado al ATM!', 'Ya puedes guardar tu celular. Digita tu PIN en la pantalla del cajero.');
            setScannedCode('');
            setView('home');

        } catch (error) {
            showError(error.message || "Error de conexión.");
        } finally {
            setCargando(false);
        }
    };

    const handleVincularManual = (e) => {
        e.preventDefault();
        procesarVinculacion(scannedCode);
    };

    const extraerCodigo = (textoEscaneado) => {
        if (!textoEscaneado) return;
        let codigoLimpio = textoEscaneado.trim();
        if (codigoLimpio.includes('/')) {
            const partes = codigoLimpio.split('/');
            codigoLimpio = partes[partes.length - 1];
        }
        procesarVinculacion(codigoLimpio);
    };

    const cargarCuenta = async (idCuenta) => {
        try {
            const res = await apiCall(`/api/auth/cuenta/${idCuenta}`);
            if (!res.ok) throw new Error("No se pudo cargar la cuenta");

            const cuentaActualizada = await res.json();

            setClienteAuth(prev => {
                const actualizado = { ...prev, ...cuentaActualizada };
                localStorage.setItem('cliente_auth', JSON.stringify(actualizado));
                return actualizado;
            });
        } catch (error) {
            console.error("No se pudo actualizar la cuenta", error);
        }
    };

    const refrescarDatosCliente = async (idCuenta) => {
        try {
            await Promise.all([
                cargarCuenta(idCuenta),
                cargarTransacciones(idCuenta)
            ]);
        } catch (error) {
            console.error("No se pudieron refrescar los datos del cliente", error);
        }
    };

    if (!clienteAuth) return null;

    const cuentaOculta = `400012${clienteAuth.idCuenta.toString().padStart(4, '0')}`;

    return (
        <section className="min-h-[100dvh] bg-slate-50 lg:bg-gray-200 lg:flex lg:items-center lg:justify-center lg:p-4 font-sans">
            {/* estilos para el scanner qr*/}
            <style>{`
                #reader { border: none !important; }
                #reader__dashboard_section_csr span,
                #reader__dashboard_section_swaplink { display: none !important; }
                #reader__dashboard_section_csr button {
                    background-color: #f5d000; color: #004a8e; font-weight: bold;
                    border: none; padding: 8px 16px; border-radius: 8px; margin-bottom: 10px;
                }
                #reader video { object-fit: cover !important; border-radius: 2rem !important; }
            `}</style>

            {/* chasis de celular solo en vista de pc */}
            <div className="w-full h-[100dvh] lg:w-[360px] lg:h-[700px] bg-slate-50 lg:rounded-[3rem] lg:shadow-2xl relative overflow-hidden lg:border-[8px] lg:border-slate-800 flex flex-col">
                <div className="hidden lg:block absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-40 mx-auto z-50"></div>

                {/* inicio de la APP bisa */}
                {view === 'home' && (
                    <div className="flex-1 flex flex-col animate-in fade-in duration-300 overflow-y-auto pb-20">
                        {/* tarjeta saldo y cabecera */}
                        <div className="bg-white px-5 pt-12 pb-6 relative">
                            <div className="flex justify-between items-center mb-6">
                                <div><h1 className="text-xl font-black text-slate-800 tracking-tight">Mi Producto</h1></div>
                                <div className="flex gap-4 text-[#003366]">
                                    <MapPin size={22} className="cursor-pointer active:scale-95 transition-transform" onClick={() => setView('mapa')} />
                                    <LogOut size={22} className="cursor-pointer active:scale-95 transition-transform" onClick={handleLogout} />
                                </div>
                            </div>
                            {/* tarjeta visual en la app */}
                            <div className="bg-gradient-to-br from-[#004a8e] to-[#002244] p-5 rounded-3xl shadow-[0_10px_25px_-5px_rgba(0,51,102,0.4)] relative overflow-hidden border border-blue-400/20">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <p className="text-white font-bold text-sm tracking-wide">Caja de Ahorro</p>
                                        <p className="text-blue-200 text-xs font-mono mt-0.5 tracking-widest">
                                            {mostrarSaldo ? cuentaOculta : '**** **** ****'}
                                        </p>
                                    </div>
                                    {/* btn de recarga */}
                                    <div className="flex gap-3 text-white/80">
                                        <RefreshCw size={18} className="cursor-pointer hover:text-white active:rotate-180 transition-all duration-300" onClick={handleRefresh} />
                                        <CreditCard size={18} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-end relative z-10">
                                    <div>
                                        <p className="text-blue-200 text-[11px] mb-1 uppercase tracking-wider font-semibold">Saldo Disponible</p>
                                        <h2 className="text-3xl font-black text-white tracking-tight">
                                            {mostrarSaldo ? <>{clienteAuth.moneda} {clienteAuth.saldo}</> : <span className="text-2xl tracking-[0.2em]">***.**</span>}
                                        </h2>
                                    </div>
                                    {/* oculta y mostrar saldo */}
                                    <button onClick={() => setMostrarSaldo(!mostrarSaldo)} className="text-blue-200 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                                        {mostrarSaldo ? <EyeOff size={22} /> : <Eye size={22} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* botones de acceso rapido */}
                        <div className="px-5 py-2">
                            <div className="flex justify-between gap-2">
                                {/* btn para abrir la cam y escanear qr */}
                                <button onClick={() => setView('scanner')} className="flex flex-col items-center gap-2 group flex-1">
                                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#004a8e] group-hover:bg-[#004a8e] group-hover:text-white group-active:scale-95 transition-all">
                                        <Smartphone size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Acceso<br/>Cajero QR</span>
                                </button>
                                 {/* btn oara ver cajeros en mapa */}
                                <button onClick={() => setView('mapa')} className="flex flex-col items-center gap-2 group flex-1">
                                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#004a8e] group-hover:bg-[#004a8e] group-hover:text-white group-active:scale-95 transition-all">
                                        <MapPin size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">ATMs<br/>Cercanos</span>
                                </button>
                                {/* btn aun en desarrollo */}
                                <button onClick={() => showError("Opción en desarrollo", "Esta función estará disponible próximamente.")} className="flex flex-col items-center gap-2 group flex-1 opacity-60">
                                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#004a8e] active:scale-95 transition-all">
                                        <Send size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Transferir<br/>Dinero</span>
                                </button>
                                {/* btn de validar billetes */}
                                <button onClick={() => setView('validador')} className="flex flex-col items-center gap-2 group flex-1">
                                    <div className="w-14 h-14 rounded-full bg-[#004a8e] border border-[#004a8e] shadow-md flex items-center justify-center text-[#f5d000] active:scale-95 transition-transform">
                                        <Camera size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#004a8e] text-center leading-tight">Validar<br/>Billete BCB</span>
                                </button>
                            </div>
                        </div>
                        {/* listado de transacciones recientes */}
                        <div className="px-5 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-slate-800 font-bold text-[15px] flex items-center gap-2">Últimos movimientos</h3>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1">
                                {transacciones.length > 0 ? (
                                    transacciones.map((tx, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.monto < 0 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#004a8e]'}`}><FileText size={18} /></div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">{tx.tipoTransaccion || 'Transacción'}</p>
                                                    <p className="text-[10px] text-slate-500 truncate w-32">{tx.numeroReferencia}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-black text-sm ${tx.monto < 0 ? 'text-red-500' : 'text-[#004a8e]'}`}>{tx.monto < 0 ? '' : '+'}{clienteAuth.moneda} {Math.abs(tx.monto)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-6"><p className="text-xs text-slate-400">No hay movimientos recientes.</p></div>
                                )}
                            </div>
                        </div>
                        {/* barra de navegacion */}
                        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center py-3 text-slate-400 pb-5 sm:pb-3 rounded-b-[2.5rem] z-50">
                            <button className="flex flex-col items-center text-[#004a8e]"><Home size={24} className="mb-1" /><span className="text-[10px] font-bold">Inicio</span></button>
                            <button onClick={() => setView('scanner')} className="relative -top-5 w-14 h-14 bg-[#004a8e] text-[#f5d000] rounded-full shadow-[0_8px_15px_rgba(0,74,142,0.3)] flex items-center justify-center border-4 border-slate-50 active:scale-95 transition-transform"><QrCode size={26} /></button>
                            <button onClick={() => setView('mapa')} className="flex flex-col items-center hover:text-[#004a8e] transition-colors"><MapPin size={24} className="mb-1" /><span className="text-[10px] font-bold">Cajeros</span></button>
                        </div>
                    </div>
                )}
                {/* mapa de cajeros */}
                {view === 'mapa' && (
                    <div className="flex-1 bg-slate-100 flex flex-col relative animate-in slide-in-from-right duration-300">
                        <div className="absolute top-0 w-full z-[400] pt-12 px-4 flex items-center justify-between pointer-events-none">
                            <button onClick={() => setView('home')} className="p-3 bg-white text-[#004a8e] rounded-xl shadow-lg pointer-events-auto active:scale-95"><ArrowLeft size={20} /></button>
                            <span className="bg-[#004a8e] text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg uppercase tracking-widest pointer-events-auto">Red BISA</span>
                            <div className="w-12"></div>
                        </div>
                        <div className="flex-1 w-full z-10">
                            <MapContainer center={[-16.489689, -68.119293]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                {cajerosUbicaciones.map((cajero, index) => (
                                    <Marker key={index} position={[parseFloat(cajero.latitud), parseFloat(cajero.longitud)]}>
                                        <Popup><div className="text-center p-1"><strong className="text-[#004a8e] block text-sm mb-1">{cajero.codigo}</strong><span className="text-xs text-gray-600 block leading-tight">{cajero.ubicacion}</span></div></Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* escaner qr para el cajero */}
                {view === 'scanner' && (
                    <div className="flex-1 bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
                        <div className="pt-12 px-4 flex items-center justify-between text-white mb-6 relative z-10">
                            <button onClick={() => setView('home')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                            <span className="font-black tracking-widest text-sm text-[#f5d000]">ESCANEAR QR</span>
                            <div className="w-10"></div>
                        </div>

                        <div className="flex-1 flex flex-col items-center px-4 relative z-10 w-full">

                            <div className="w-full max-w-[280px] aspect-square rounded-[2rem] overflow-hidden border-4 border-[#f5d000] shadow-[0_0_30px_rgba(245,208,0,0.3)] bg-black relative mb-6 flex justify-center items-center">

                                <CustomQrScanner onScanSuccess={extraerCodigo} />

                                <div className="absolute inset-0 pointer-events-none z-20">
                                    <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-xl"></div>
                                    <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-xl"></div>
                                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-xl"></div>
                                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-xl"></div>
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 shadow-[0_0_10px_red] animate-pulse"></div>
                                </div>
                            </div>

                            <p className="text-blue-100 text-center text-sm font-medium px-4 mb-6">Apunta al QR del Cajero Automático.</p>
                        </div>
                    </div>
                )}

                {/* componente para validad billetes */}
                {view === 'validador' && (
                    <div className="flex-1 bg-slate-900 flex items-center justify-center animate-in slide-in-from-bottom duration-300 relative z-50 px-4">
                        <DetectorBilletes onClose={() => setView('home')} />
                    </div>
                )}
            </div>
        </section>
    );
};

export default MobileDashboard;