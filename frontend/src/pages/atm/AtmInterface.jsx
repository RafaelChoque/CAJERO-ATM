import React, { useState, useEffect, useRef } from 'react';
import { Delete, AlertCircle, RefreshCw, Lock, ArrowLeft, ChevronRight, Wallet, Receipt, DollarSign, Settings, Camera } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../../context/AuthContext';
import logoBisa from '../../assets/logo-bisa.png';
import { showError } from '../../utils/alerts';
import DetectorBilletes from '../../components/DetectorBilletes';

import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const AtmInterface = () => {
    const { apiCall } = useAuth();

    const [cajeroId, setCajeroId] = useState(localStorage.getItem('ATM_ID') || null);
    const [step, setStep] = useState(cajeroId ? 'welcome' : 'setup');
    const [inputSetup, setInputSetup] = useState('');

    const [pin, setPin] = useState('');
    const [codigoToken, setCodigoToken] = useState(null);
    const [idCuenta, setIdCuenta] = useState(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const [pinError, setPinError] = useState(null);
    const [pinAttempts, setPinAttempts] = useState(0);

    const stompClientRef = useRef(null);
    const timerInterval = useRef(null);

    const [retiroMonto, setRetiroMonto] = useState('');
    const [retiroError, setRetiroError] = useState(null);
    const [retiroResultado, setRetiroResultado] = useState(null);

    useEffect(() => {
        return () => detenerTodo();
    }, []);

    const configurarTerminal = (e) => {
        e.preventDefault();
        if (!inputSetup) return;

        localStorage.setItem('ATM_ID', inputSetup);
        setCajeroId(inputSetup);
        setStep('welcome');
    };

    const iniciarOperacionQR = async () => {
        setError(null);
        setCargando(true);
        try {
            const response = await apiCall(`/api/qr/generar/${cajeroId}`, { method: 'POST' });

            if (!response.ok) throw new Error("Terminal temporalmente fuera de servicio.");

            const data = await response.json();
            setCodigoToken(data.codigoToken);
            setStep('qr');
            iniciarTemporizador();

            conectarWebSocket(data.codigoToken);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    const conectarWebSocket = (codigoActual) => {
        const wsUrl = window.location.origin + '/ws-atm';

        const socket = new SockJS(wsUrl);
        const stompClient = Stomp.over(socket);

        stompClient.debug = null;

        stompClient.connect({}, () => {
            console.log("Conectado");
            stompClientRef.current = stompClient;

            stompClient.subscribe(`/topic/qr/${codigoActual}`, (mensaje) => {
                const data = JSON.parse(mensaje.body);

                if (data.estado === 'VINCULADO') {
                    detenerTodo();
                    setIdCuenta(data.idCuenta);
                    setStep('pin');
                } else if (data.estado === 'EXPIRADO') {
                    detenerTodo();
                    setStep('timeout');
                }
            });
        }, (err) => {
            console.error("Error de conexión WebSocket", err);
            showError("Desconexión", "Se perdió la señal con el servidor central.");
        });
    };

    const iniciarTemporizador = () => {
        setTimeLeft(60);
        if (timerInterval.current) clearInterval(timerInterval.current);
        timerInterval.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    detenerTodo();
                    setStep('timeout');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const detenerTodo = () => {
        if (timerInterval.current) clearInterval(timerInterval.current);
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.disconnect();
            console.log("🔌 Desconectado del satélite BISA");
        }
    };

    const addNumber = (num) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setPinError(null);
        }
    };

    const validarPin = async () => {
        if (pin.length !== 4) return;

        setCargando(true);
        setPinError(null);
        try {
            const response = await apiCall('/api/qr/validar-pin', {
                method: 'POST',
                body: JSON.stringify({
                    idCuenta: idCuenta,
                    pin: pin
                })
            });

            if (response.ok) {
                setPinAttempts(0);
                setStep('main_menu');
            } else {
                const data = await response.json();
                setPin('');

                if (data.mensaje && (data.mensaje.includes("bloqueada") || data.mensaje.includes("inactiva"))) {
                    showError("Operación Denegada", data.mensaje);
                    reiniciarCajero();
                    return;
                }

                const intentosActuales = pinAttempts + 1;

                if (intentosActuales >= 3) {
                    showError("Seguridad BISA", "Has ingresado un PIN incorrecto 3 veces. Por seguridad, la operación ha sido cancelada.");
                    reiniciarCajero();
                } else {
                    setPinAttempts(intentosActuales);
                    setPinError(`PIN Incorrecto. Intento ${intentosActuales} de 3.`);
                }
            }
        } catch (err) {
            setPin('');
            setPinError("Error de conexión. Intente nuevamente.");
        } finally {
            setCargando(false);
        }
    };

    const reiniciarCajero = () => {
        detenerTodo();
        setCodigoToken(null);
        setIdCuenta(null);
        setPin('');
        setError(null);
        setPinError(null);
        setPinAttempts(0);
        setStep('welcome');
    };

    const mostrarOpcionEnDesarrollo = (operacion) => {
        alert(`Operación: ${operacion}\nID Cuenta: ${idCuenta}\nID Cajero: ${cajeroId}`);
    };

    const abrirRetiro = () => {
        setRetiroMonto('');
        setRetiroError(null);
        setRetiroResultado(null);
        setStep('withdraw_amount');
    };

    const agregarDigitoRetiro = (digito) => {
        setRetiroError(null);
        setRetiroMonto(prev => {
            const nuevo = `${prev}${digito}`;
            return nuevo.length > 5 ? prev : nuevo;
        });
    };

    const borrarRetiro = () => {
        setRetiroMonto(prev => prev.slice(0, -1));
    };

    const solicitarRetiro = async () => {
        if (!retiroMonto || Number(retiroMonto) <= 0) {
            setRetiroError('Ingrese un monto válido');
            return;
        }

        setCargando(true);
        setRetiroError(null);

        try {
            const response = await apiCall('/api/qr/retiros/reservar', {
                method: 'POST',
                body: JSON.stringify({
                    idCuenta: idCuenta,
                    idCajero: Number(cajeroId),
                    monto: Number(retiroMonto)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No se pudo preparar el retiro');
            }

            setRetiroResultado(data);
            setStep('withdraw_preview');
        } catch (err) {
            setRetiroError(err.message || 'No se pudo preparar el retiro');
        } finally {
            setCargando(false);
        }
    };

    const confirmarRetiro = async () => {
        if (!retiroResultado) return;

        setCargando(true);
        try {
            const response = await apiCall(`/api/qr/retiros/confirmar?idCuenta=${idCuenta}`, {
                method: 'POST',
                body: JSON.stringify(retiroResultado)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No se pudo confirmar el retiro');
            }

            setStep('withdraw_success');
        } catch (err) {
            setRetiroError(err.message || 'No se pudo confirmar el retiro');
        } finally {
            setCargando(false);
        }
    };

    const cancelarRetiro = async () => {
        if (!retiroResultado) {
            setStep('main_menu');
            return;
        }

        setCargando(true);
        try {
            await apiCall('/api/qr/retiros/cancelar', {
                method: 'POST',
                body: JSON.stringify(retiroResultado)
            });
        } catch (err) {
            console.error(err);
        } finally {
            setCargando(false);
            setRetiroMonto('');
            setRetiroResultado(null);
            setRetiroError(null);
            setStep('main_menu');
        }
    };

    const volverAlMenuTrasRetiro = () => {
        setRetiroMonto('');
        setRetiroError(null);
        setRetiroResultado(null);
        setStep('main_menu');
    };

    return (
        <div className="h-screen w-screen bg-[#d9e2ec] flex items-center justify-center font-sans overflow-hidden select-none">
            <div className="w-[1024px] h-[768px] bg-[#c0c9d4] rounded-3xl border-[16px] border-[#a5b1c2] shadow-[inset_0_0_50px_rgba(0,0,0,0.2),0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative p-12">
                <div className="w-full h-full bg-white rounded-xl border-8 border-[#2d3436] shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] overflow-hidden relative flex flex-col text-slate-800">
                     {/* encabezado de pantalla  */}
                    {step !== 'welcome' && step !== 'setup' && (
                        <div className="px-6 py-4 shrink-0 flex items-center justify-between z-10 relative bg-white">
                            <div className="flex items-center gap-4">
                                <img src={logoBisa} alt="BISA" className="h-10" onError={(e) => e.target.style.display = 'none'} />
                                <span className="text-[#003366] font-black italic text-lg uppercase">Terminal #{cajeroId}</span>
                            </div>
                            {step === 'main_menu' && (
                                <button onClick={reiniciarCajero} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold shadow-md active:scale-95 text-sm flex items-center gap-2">
                                    <Delete size={16} /> FINALIZAR SESIÓN
                                </button>
                            )}
                        </div>
                    )}

                    <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                        {/* configuracion inicial del atm (cuando se ingresa por primera vez)*/}
                        {step === 'setup' && (
                            <div className="absolute inset-0 w-full h-full bg-[#001a33] flex flex-col items-center justify-center p-12 z-50">
                                <Settings size={60} className="text-[#f5d000] mb-6 animate-pulse" />
                                <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Terminal no configurada</h2>
                                <p className="text-blue-200 mb-8 font-medium">Por favor, asigne el código de la base de datos a este Cajero</p>

                                <form onSubmit={configurarTerminal} className="flex flex-col gap-4 w-full max-w-sm">
                                    <input
                                        type="text"
                                        value={inputSetup}
                                        onChange={(e) => setInputSetup(e.target.value)}
                                        placeholder="Ejemplo: ATM-LPZ-1"
                                        className="w-full text-center text-2xl font-black p-4 rounded-xl outline-none focus:ring-4 focus:ring-[#f5d000]"
                                        autoFocus
                                    />
                                    <button type="submit" className="bg-[#f5d000] text-[#003366] font-black py-4 rounded-xl uppercase tracking-widest hover:bg-[#e6c200] active:scale-95 transition-all shadow-lg">
                                        Vincular y Arrancar
                                    </button>
                                </form>
                            </div>
                        )}
                        {/* bienvenida al cliente */}
                        {step === 'welcome' && (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-white flex flex-col items-center justify-center p-12">
                                <img src={logoBisa} alt="BISA" className="h-28 mb-4 drop-shadow-lg" onError={(e) => e.target.style.display = 'none'} />
                                <span className="text-[#003366] font-medium italic text-3xl mb-12">simplificando tu vida</span>

                                {error && (
                                    <div className="absolute top-10 w-3/4 text-red-600 text-xl text-center bg-red-100 p-4 rounded-xl border-2 border-red-300 shadow-md">
                                        <AlertCircle className="inline mr-2" /> {error}
                                    </div>
                                )}

                                <div className="absolute bottom-12 right-12">
                                    <button
                                        onClick={() => setStep('options')}
                                        className="bg-[#f5d000] text-[#003366] px-8 py-4 rounded-full font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 border-4 border-transparent hover:border-[#003366]/10"
                                    >
                                        SIN TARJETA <ChevronRight size={28} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* seleccion de metodo cardless*/}
                        {step === 'options' && (
                            <div className="w-full h-full flex flex-col items-center justify-center relative animate-in fade-in">
                                <h2 className="text-4xl font-black text-[#003366] italic mb-12 tracking-tight">Selecciona la operación</h2>

                                <div className="flex flex-col gap-8 w-full max-w-lg ml-auto mr-12">
                                    <button
                                        onClick={iniciarOperacionQR}
                                        disabled={cargando}
                                        className="flex items-center justify-end gap-6 group"
                                    >
                                        <span className="text-3xl font-bold text-[#003366] group-hover:text-[#f5d000] transition-colors">
                                            {cargando ? 'Conectando...' : 'Retiro QR Móvil'}
                                        </span>
                                        <div className="w-16 h-10 bg-[#003366] rounded-full shadow-inner group-hover:bg-[#f5d000] transition-colors border-2 border-slate-200"></div>
                                    </button>
                                </div>

                                <div className="absolute bottom-0 left-0">
                                    <button
                                        onClick={reiniciarCajero}
                                        className="bg-[#003366] text-white px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 shadow-md hover:bg-blue-900 active:scale-95 transition-all"
                                    >
                                        <ArrowLeft size={20} /> VOLVER
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* renderizado del codigo QR para la app movil */}
                        {step === 'qr' && (
                            <div className="w-full h-full flex flex-col items-center justify-center relative animate-in fade-in">
                                <h2 className="text-3xl font-black text-[#003366] italic mb-6 text-center leading-tight">Escanee este código <br /> con su App BISA Móvil</h2>

                                <div className="bg-white p-4 border-4 border-slate-200 rounded-3xl shadow-xl flex flex-col items-center">
                                    {codigoToken ? (
                                        <div className="p-2 border-4 border-[#003366] rounded-xl relative">
                                            <QRCode value={codigoToken} size={220} fgColor="#003366" />
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#f5d000] shadow-[0_0_15px_#f5d000] animate-bounce opacity-80 rounded-t-lg"></div>
                                        </div>
                                    ) : (
                                        <div className="w-[220px] h-[220px] flex items-center justify-center bg-slate-100 rounded-xl">
                                            <RefreshCw className="animate-spin text-slate-400" size={32} />
                                        </div>
                                    )}
                                </div>
                                <p className="mt-6 text-xl text-slate-500 font-bold">Tiempo restante: <span className="text-red-600 font-mono font-black">{timeLeft}s</span></p>

                                <div className="absolute bottom-0 right-0">
                                    <button
                                        onClick={reiniciarCajero}
                                        className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-md hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <Delete size={20} /> CANCELAR
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* validacion de pin numerico teclado*/}
                        {step === 'pin' && (
                            <div className="w-full h-full flex flex-col items-center justify-center relative animate-in slide-in-from-right">
                                <h2 className="text-3xl font-black text-[#003366] italic mb-6">Introduce el número PIN</h2>

                                {pinError && (
                                    <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold mb-4 flex items-center gap-2 animate-in fade-in zoom-in">
                                        <AlertCircle size={20} />
                                        {pinError}
                                    </div>
                                )}

                                <div className={`border-4 ${pinError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-50'} px-12 py-4 rounded-lg shadow-inner mb-6 flex items-center justify-center w-64 h-20 transition-colors`}>
                                    <span className={`text-5xl font-black ${pinError ? 'text-red-600' : 'text-[#003366]'} tracking-[0.3em] leading-none mt-4 transition-colors`}>
                                        {pin.replace(/./g, '*')}
                                    </span>
                                </div>

                                <div className="w-full max-w-lg ml-auto mr-12 flex justify-end mb-4">
                                    <button onClick={validarPin} disabled={cargando} className="flex items-center gap-4 group">
                                        <span className="text-2xl font-bold text-slate-500 italic group-hover:text-[#003366] transition-colors">{cargando ? 'Validando...' : 'Continuar'}</span>
                                        <div className="w-16 h-10 bg-[#003366] rounded-full shadow-inner group-hover:bg-[#f5d000] transition-colors border-2 border-slate-200"></div>
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-3 bg-slate-100 p-4 rounded-2xl shadow-lg border border-slate-200">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'BORRAR', 0, 'ACEPTAR'].map((btn) => (
                                        <button
                                            key={btn}
                                            onClick={() => {
                                                if (btn === 'ACEPTAR') validarPin();
                                                else if (btn === 'BORRAR') setPin('');
                                                else addNumber(btn);
                                            }}
                                            className={`h-12 w-16 rounded-lg font-black text-xl flex items-center justify-center active:scale-95 border-b-4 transition-all shadow-sm ${
                                                btn === 'ACEPTAR' ? 'bg-green-500 text-white border-green-700 col-span-2 w-full text-lg hover:bg-green-600' :
                                                btn === 'BORRAR' ? 'bg-red-500 text-white border-red-700 col-span-2 w-full text-lg hover:bg-red-600' :
                                                'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {btn === 'BORRAR' ? <Delete size={20} /> : btn}
                                        </button>
                                    ))}
                                </div>

                                <div className="absolute bottom-0 left-0">
                                    <button onClick={reiniciarCajero} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-md hover:bg-red-700 active:scale-95 transition-all">
                                        CANCELAR
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* pantalla principal tras autenticarse */}
                        {step === 'main_menu' && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95">
                                <h2 className="text-3xl font-black text-[#003366] italic mb-2 text-center">¿Qué transacción deseas realizar?</h2>
                                <p className="text-lg text-slate-500 font-semibold mb-8">Sesión segura iniciada mediante BISA Móvil</p>

                                <div className="grid grid-cols-2 gap-6 w-full max-w-4xl px-8">
                                    <button onClick={abrirRetiro} className="bg-white border-4 border-slate-200 hover:border-[#003366] h-32 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all">
                                        <DollarSign size={40} className="text-slate-400 group-hover:text-[#003366]" />
                                        <span className="text-xl font-bold text-[#003366]">Retiro de Efectivo</span>
                                    </button>

                                    <button onClick={() => setStep('validator')} className="bg-white border-4 border-slate-200 hover:border-[#003366] h-32 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all">
                                        <Camera size={40} className="text-slate-400 group-hover:text-[#003366]" />
                                        <span className="text-xl font-bold text-[#003366]">Validar Depósito</span>
                                    </button>

                                    <button onClick={() => mostrarOpcionEnDesarrollo('Mini Extracto')} className="bg-white border-4 border-slate-200 hover:border-[#003366] h-32 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all">
                                        <Receipt size={40} className="text-slate-400 group-hover:text-[#003366]" />
                                        <span className="text-xl font-bold text-[#003366]">Mini Extracto</span>
                                    </button>

                                    <button onClick={() => mostrarOpcionEnDesarrollo('Transferencia Rápida')} className="bg-[#f5d000] border-4 border-[#e5c100] hover:bg-[#e5c100] h-32 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all">
                                        <RefreshCw size={36} className="text-[#003366]" />
                                        <span className="text-xl font-bold text-[#003366]">Transferencias</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* detector de billetes */}
                        {step === 'validator' && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in absolute inset-0 z-50 bg-[#001a33]/95 rounded-xl">
                                <DetectorBilletes onClose={() => setStep('main_menu')} />
                            </div>
                        )}

                        {step === 'timeout' && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in">
                                <AlertCircle size={80} className="text-red-500 mb-6 animate-bounce" />
                                <h2 className="text-4xl font-black text-[#003366] italic mb-4">Tiempo Expirado</h2>
                                <button
                                    onClick={reiniciarCajero}
                                    className="mt-6 bg-[#003366] text-white px-8 py-4 rounded-xl font-bold text-xl flex items-center gap-3 shadow-lg hover:bg-blue-900 active:scale-95 transition-all"
                                >
                                    <ArrowLeft size={24} /> VOLVER AL INICIO
                                </button>
                            </div>
                        )}
                        {/* flujo de retiro de efectivo */}
                        {step === 'withdraw_amount' && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in">
                                <h2 className="text-3xl font-black text-[#003366] italic mb-4">Retiro de Efectivo</h2>
                                <p className="text-slate-500 font-semibold mb-6">Ingrese el monto a retirar</p>

                                {retiroError && (
                                    <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold mb-4">
                                        {retiroError}
                                    </div>
                                )}

                                <div className="border-4 border-slate-300 bg-slate-50 px-12 py-4 rounded-lg shadow-inner mb-6 flex items-center justify-center w-72 h-20">
                                    <span className="text-4xl font-black text-[#003366]">
                                        Bs {retiroMonto || '0'}
                                    </span>
                                </div>

                                <div className="flex gap-3 mb-6">
                                    {[50, 100, 200, 500].map(valor => (
                                        <button
                                            key={valor}
                                            onClick={() => setRetiroMonto(String(valor))}
                                            className="bg-white border-2 border-slate-300 px-5 py-3 rounded-xl font-black text-[#003366] hover:bg-slate-50"
                                        >
                                            Bs {valor}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-3 bg-slate-100 p-4 rounded-2xl shadow-lg border border-slate-200">
                                    {[1,2,3,4,5,6,7,8,9,'BORRAR',0,'ACEPTAR'].map((btn) => (
                                        <button
                                            key={btn}
                                            onClick={() => {
                                                if (btn === 'ACEPTAR') solicitarRetiro();
                                                else if (btn === 'BORRAR') borrarRetiro();
                                                else agregarDigitoRetiro(btn);
                                            }}
                                            className={`h-12 w-20 rounded-lg font-black text-xl flex items-center justify-center active:scale-95 border-b-4 transition-all shadow-sm ${
                                                btn === 'ACEPTAR'
                                                    ? 'bg-green-500 text-white border-green-700 hover:bg-green-600'
                                                    : btn === 'BORRAR'
                                                        ? 'bg-red-500 text-white border-red-700 hover:bg-red-600'
                                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {btn}
                                        </button>
                                    ))}
                                </div>

                                <div className="absolute bottom-0 left-0">
                                    <button onClick={() => setStep('main_menu')} className="bg-[#003366] text-white px-6 py-3 rounded-xl font-bold text-lg shadow-md hover:bg-blue-900 active:scale-95 transition-all">
                                        VOLVER
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* visualizacion de calculo del algoritmo voraz */}
                        {step === 'withdraw_preview' && retiroResultado && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in px-10">
                                <h2 className="text-3xl font-black text-[#003366] italic mb-3">Confirmar Retiro</h2>
                                <p className="text-slate-500 font-semibold mb-6">
                                    Monto solicitado: Bs {retiroResultado.montoSolicitado}
                                </p>

                                <div className="w-full max-w-3xl bg-white border-2 border-slate-200 rounded-2xl shadow-lg p-6 space-y-4 overflow-y-auto max-h-64">
                                    {retiroResultado.detalles.map((detalle, index) => (
                                        <div key={index} className="border border-slate-200 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-black text-[#003366] text-lg">
                                                    {detalle.cantidad} x Bs {detalle.denominacion}
                                                </span>
                                                <span className="text-slate-500 font-bold">
                                                    Caseta #{detalle.idCaseta}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {detalle.numerosSerie.map((serie) => (
                                                    <span key={serie} className="px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs font-mono text-slate-700">
                                                        {serie}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {retiroError && (
                                    <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold mt-4">
                                        {retiroError}
                                    </div>
                                )}

                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={cancelarRetiro}
                                        className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-red-700 active:scale-95 transition-all"
                                    >
                                        CANCELAR
                                    </button>

                                    <button
                                        onClick={confirmarRetiro}
                                        disabled={cargando}
                                        className="bg-[#003366] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-900 active:scale-95 transition-all"
                                    >
                                        {cargando ? 'PROCESANDO...' : 'CONFIRMAR ENTREGA'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* pantalla de exito en el retiro fisico */}
                        {step === 'withdraw_success' && retiroResultado && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95">
                                <DollarSign size={70} className="text-green-600 mb-4" />
                                <h2 className="text-4xl font-black text-[#003366] italic mb-2">Retiro Exitoso</h2>
                                <p className="text-xl text-slate-600 font-semibold mb-6">
                                    Se dispensó Bs {retiroResultado.montoDispensado}
                                </p>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 w-full max-w-2xl overflow-y-auto max-h-48">
                                    <h3 className="text-lg font-black text-[#003366] mb-3">Billetes entregados</h3>
                                    <div className="space-y-3">
                                        {retiroResultado.detalles.map((detalle, index) => (
                                            <div key={index} className="flex justify-between border-b border-slate-200 pb-2">
                                                <span className="font-bold text-slate-700">
                                                    {detalle.cantidad} x Bs {detalle.denominacion}
                                                </span>
                                                <span className="text-slate-500 text-xs text-right max-w-[50%]">
                                                    {detalle.numerosSerie.join(', ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={volverAlMenuTrasRetiro}
                                    className="mt-8 bg-[#003366] text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-blue-900 active:scale-95 transition-all"
                                >
                                    VOLVER AL MENÚ
                                </button>
                            </div>
                        )}
                    </main>
                </div>

                {/* ranura de deposito y entrega de dinero */}
                <div className="absolute bottom-4 w-full flex justify-around px-32">
                    <div className="w-48 h-8 bg-black rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] border-4 border-gray-600"></div>
                    <div className="w-48 h-8 bg-black rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] border-4 border-gray-600 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-green-500/20 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AtmInterface;