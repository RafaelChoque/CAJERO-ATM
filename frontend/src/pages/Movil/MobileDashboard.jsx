import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess, confirmAction } from '../../utils/alerts';
import {
    Home, ArrowLeft, Smartphone, LogOut, MapPin,
    CreditCard, Eye, EyeOff, RefreshCw, Send, QrCode, FileText, Keyboard
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';

// 🚀 IMPORTAMOS LAS LIBRERÍAS DE WEBSOCKETS (Para el "Kill Switch")
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

// Truco necesario para que Leaflet encuentre sus iconos en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente hijo encargado exclusivamente de encender la cámara y leer el QR
const CustomQrScanner = ({ onScanSuccess }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false // false = sin logs feos en la consola
        );

        scanner.render(
            (decodedText) => {
                scanner.clear(); // Apaga la cámara apenas lee algo
                onScanSuccess(decodedText);
            },
            (error) => {} // Ignoramos los errores constantes mientras busca el QR
        );

        return () => {
            scanner.clear().catch(e => console.error(e));
        };
    }, [onScanSuccess]);

    return <div id="reader" className="w-full h-full object-cover"></div>;
};

const MobileDashboard = () => {
    const navigate = useNavigate();
    // Extraemos las funciones de nuestro contexto Inteligente
    const { apiCall, cerrarSesionCliente } = useAuth();

    // Vistas principales: 'home' (Inicio), 'mapa' (ATMs Cercanos) y 'scanner' (Cámara QR)
    const [view, setView] = useState('home');
    const [clienteAuth, setClienteAuth] = useState(null);
    const [scannedCode, setScannedCode] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarIngresoManual, setMostrarIngresoManual] = useState(false);

    const [mostrarSaldo, setMostrarSaldo] = useState(true);
    const [cajerosUbicaciones, setCajerosUbicaciones] = useState([]);
    const [transacciones, setTransacciones] = useState([]);

    // 1. Al cargar la app, revisamos si el cliente tiene datos guardados
    useEffect(() => {
        const dataStr = localStorage.getItem('cliente_auth');
        if (dataStr) {
            const cliente = JSON.parse(dataStr);
            setClienteAuth(cliente);
            cargarTransacciones(cliente.idCuenta);
            cargarCajerosMapa(); // 🚀 RESTAURADO: Cargamos los cajeros desde el principio
        }
    }, []);

    // 2. EL "OÍDO" DEL CELULAR: Escucha el canal de seguridad en tiempo real
    useEffect(() => {
        if (!clienteAuth) return;

        // Conexión dinámica (funciona en localhost y en ngrok)
        const wsUrl = window.location.origin + '/ws-atm';
        const socket = new SockJS(wsUrl);
        const stompClient = Stomp.over(socket);

        stompClient.debug = null; // Mantenemos la consola limpia

        stompClient.connect({}, () => {
            // Se suscribe a su canal personal usando su ID de cuenta
            stompClient.subscribe(`/topic/seguridad/${clienteAuth.idCuenta}`, (mensaje) => {
                const data = JSON.parse(mensaje.body);

                // Si Java dispara el "Kill Switch" (CERRAR_SESION)
                if (data.accion === 'CERRAR_SESION') {
                    stompClient.disconnect();
                    showError("Bloqueo de Seguridad", data.motivo);
                    // 🚀 MEJORA: Usamos la función del contexto para limpiar todo correctamente
                    cerrarSesionCliente();
                }
            });
        }, (err) => {
            console.error("No se pudo conectar al canal de seguridad.", err);
        });

        // Limpieza: Si el cliente cierra la app, nos desconectamos del WebSocket
        return () => {
            if (stompClient.connected) stompClient.disconnect();
        };
    }, [clienteAuth, cerrarSesionCliente]);

    // Trae las coordenadas de los cajeros que están "ACTIVOS"
    const cargarCajerosMapa = async () => {
        try {
            const res = await apiCall(`/api/auth/cajeros-cercanos`);
            if (res.ok) setCajerosUbicaciones(await res.json());
        } catch (error) {
            console.error("No se pudo cargar el mapa de cajeros", error);
        }
    };

    // Trae el recibo de las transacciones (ej: Retiros en ATM)
    const cargarTransacciones = async (idCuenta) => {
        try {
            const res = await apiCall(`/api/auth/movimientos/${idCuenta}`);
            if (res.ok) setTransacciones(await res.json());
        } catch (error) {
            console.error("No se pudieron cargar los movimientos", error);
            setTransacciones([]);
        }
    };

    // Botón de sincronizar: Refresca el saldo y los movimientos manualmente
    const handleRefresh = () => {
        if (clienteAuth) {
            cargarTransacciones(clienteAuth.idCuenta);
            showSuccess("Actualizado", "Tus datos han sido sincronizados.");
        }
    };

    // Salida voluntaria de la aplicación
    const handleLogout = async () => {
        const confirmar = await confirmAction({
            title: '¿Cerrar Sesión?',
            text: 'Saldrás de tu cuenta de Banca Móvil.',
            confirmText: 'Sí, salir'
        });

        if (confirmar) {
             // 🚀 MEJORA: Usamos la función del contexto
             cerrarSesionCliente();
        }
    };

    // El núcleo del Cardless: Envía el código al backend para que el Cajero despierte
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

    if (!clienteAuth) return null;

    const cuentaOculta = `400012${clienteAuth.idCuenta.toString().padStart(4, '0')}`;

    return (
        <section className="min-h-[100dvh] bg-slate-50 lg:bg-gray-200 lg:flex lg:items-center lg:justify-center lg:p-4 font-sans">
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

            <div className="w-full h-[100dvh] lg:w-[360px] lg:h-[700px] bg-slate-50 lg:rounded-[3rem] lg:shadow-2xl relative overflow-hidden lg:border-[8px] lg:border-slate-800 flex flex-col">
                <div className="hidden lg:block absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-40 mx-auto z-50"></div>

                {view === 'home' && (
                    <div className="flex-1 flex flex-col animate-in fade-in duration-300 overflow-y-auto pb-20">

                        <div className="bg-white px-5 pt-12 pb-6 relative">
                            <div className="flex justify-between items-center mb-6">
                                <div><h1 className="text-xl font-black text-slate-800 tracking-tight">Mi Producto</h1></div>
                                <div className="flex gap-4 text-[#003366]">
                                    <MapPin size={22} className="cursor-pointer active:scale-95 transition-transform" onClick={() => setView('mapa')} />
                                    <LogOut size={22} className="cursor-pointer active:scale-95 transition-transform" onClick={handleLogout} />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#004a8e] to-[#002244] p-5 rounded-3xl shadow-[0_10px_25px_-5px_rgba(0,51,102,0.4)] relative overflow-hidden border border-blue-400/20">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <p className="text-white font-bold text-sm tracking-wide">Caja de Ahorro</p>
                                        <p className="text-blue-200 text-xs font-mono mt-0.5 tracking-widest">
                                            {mostrarSaldo ? cuentaOculta : '**** **** ****'}
                                        </p>
                                    </div>
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
                                    <button onClick={() => setMostrarSaldo(!mostrarSaldo)} className="text-blue-200 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                                        {mostrarSaldo ? <EyeOff size={22} /> : <Eye size={22} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-2">
                            <div className="flex justify-between gap-2">
                                <button onClick={() => setView('scanner')} className="flex flex-col items-center gap-2 group flex-1">
                                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#004a8e] group-hover:bg-[#004a8e] group-hover:text-white group-active:scale-95 transition-all">
                                        <Smartphone size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Acceso<br/>Cajero QR</span>
                                </button>

                                <button onClick={() => setView('mapa')} className="flex flex-col items-center gap-2 group flex-1">
                                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#004a8e] group-hover:bg-[#004a8e] group-hover:text-white group-active:scale-95 transition-all">
                                        <MapPin size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">ATMs<br/>Cercanos</span>
                                </button>

                                <button onClick={() => showError("Opción en desarrollo", "Esta función estará disponible próximamente.")} className="flex flex-col items-center gap-2 group flex-1 opacity-60">
                                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#004a8e] active:scale-95 transition-all">
                                        <Send size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Transferir<br/>Dinero</span>
                                </button>

                                <button onClick={() => showError("Opción en desarrollo", "Esta función estará disponible próximamente.")} className="flex flex-col items-center gap-2 group flex-1 opacity-60">
                                    <div className="w-14 h-14 rounded-full bg-[#004a8e] border border-[#004a8e] shadow-md flex items-center justify-center text-[#f5d000] active:scale-95 transition-all">
                                        <QrCode size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Cobro /<br/>Pago QR</span>
                                </button>
                            </div>
                        </div>

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

                        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center py-3 text-slate-400 pb-5 sm:pb-3 rounded-b-[2.5rem] z-50">
                            <button className="flex flex-col items-center text-[#004a8e]"><Home size={24} className="mb-1" /><span className="text-[10px] font-bold">Inicio</span></button>
                            <button onClick={() => setView('scanner')} className="relative -top-5 w-14 h-14 bg-[#004a8e] text-[#f5d000] rounded-full shadow-[0_8px_15px_rgba(0,74,142,0.3)] flex items-center justify-center border-4 border-slate-50 active:scale-95 transition-transform"><QrCode size={26} /></button>
                            <button onClick={() => setView('mapa')} className="flex flex-col items-center hover:text-[#004a8e] transition-colors"><MapPin size={24} className="mb-1" /><span className="text-[10px] font-bold">Cajeros</span></button>
                        </div>
                    </div>
                )}

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

                            <button onClick={() => setMostrarIngresoManual(!mostrarIngresoManual)} className="text-blue-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"><Keyboard size={16} />{mostrarIngresoManual ? 'Ocultar Teclado' : 'Ingresar manualmente'}</button>
                            {mostrarIngresoManual && (
                                <form onSubmit={handleVincularManual} className="w-full max-w-xs mt-4 animate-in slide-in-from-top-4">
                                    <input type="text" value={scannedCode} onChange={(e) => setScannedCode(e.target.value.toUpperCase())} className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 text-center font-mono text-lg tracking-[0.3em] focus:outline-none focus:border-[#f5d000] focus:bg-white/20 mb-3" placeholder="CÓDIGO MANUAL" required maxLength="45" />
                                    <button type="submit" disabled={cargando} className="w-full bg-white/10 border border-white/20 text-white font-bold uppercase py-3 rounded-2xl shadow-xl flex justify-center items-center">{cargando ? <span className="animate-spin text-lg">↻</span> : 'VINCULAR'}</button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default MobileDashboard;