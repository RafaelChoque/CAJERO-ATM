import React, { useState, useEffect, useRef } from 'react';
import { Delete, AlertCircle, RefreshCw, Lock, ArrowLeft, ChevronRight, Wallet, Receipt, DollarSign, Settings, Camera } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import logoBisa from '../../assets/logo-bisa.png';
import { showError } from '../../utils/alerts';
import DetectorBilletes from '../../components/DetectorBilletes';

import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const AtmInterface = () => {
    const { apiCall } = useAuth();
    const { t, i18n } = useTranslation();

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

    const toggleIdioma = () => {
        const nuevoIdioma = i18n.language === 'es' ? 'en' : 'es';
        i18n.changeLanguage(nuevoIdioma);
        localStorage.setItem('idioma', nuevoIdioma);
    };

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
                    setPinError(`${t('pin.errorIncorrect')} ${intentosActuales} ${t('pin.of')}`);
                }
            }
        } catch (err) {
            setPin('');
            setPinError(t('pin.errorConnection'));
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
                    monto: Number(retiroMonto) || 0
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'No se pudo preparar el retiro');
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
            if (!response.ok) throw new Error(data.message || 'No se pudo confirmar el retiro');
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
        <div className="h-screen w-screen bg-slate-100 flex items-center justify-center font-sans overflow-hidden select-none p-2">
            {/* Contenedor ATM */}
            <div className="w-screen max-w-full h-screen bg-slate-900 rounded-3xl border-8 border-slate-800 shadow-2xl overflow-hidden relative flex flex-row">
                {/* Pantalla */}
                <div className="flex-1 bg-white overflow-hidden flex flex-col relative px-8">
                    {/* Botón idioma (Siempre visible, arriba derecha) */}
                    {step !== 'setup' && (
                        <button
                            onClick={toggleIdioma}
                            className="absolute top-3 right-3 z-50 w-10 h-10 flex items-center justify-center bg-[#003366] text-white rounded-full font-black text-xs shadow-lg hover:rotate-12 active:scale-95 transition-all border-2 border-white"
                        >
                            {i18n.language === 'es' ? 'EN' : 'ES'}
                        </button>
                    )}

                    {/* SETUP */}
                    {step === 'setup' && (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6">
                            <Settings size={50} className="text-yellow-400 mb-4 animate-pulse" />
                            <h2 className="text-2xl font-black text-white text-center mb-2">{t('terminal.notConfigured')}</h2>
                            <p className="text-blue-200 text-center text-sm mb-6">{t('terminal.assignCode')}</p>
                            <form onSubmit={configurarTerminal} className="w-full max-w-xs">
                                <input
                                    type="text"
                                    value={inputSetup}
                                    onChange={(e) => setInputSetup(e.target.value)}
                                    placeholder={t('terminal.example')}
                                    className="w-full text-center text-xl font-bold p-3 rounded-lg outline-none mb-3 focus:ring-2 focus:ring-yellow-400"
                                    autoFocus
                                />
                                <button type="submit" className="w-full bg-yellow-400 text-slate-900 font-bold py-3 rounded-lg hover:bg-yellow-500 active:scale-95 transition-all">
                                    {t('terminal.setupBtn')}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* WELCOME */}
                    {step === 'welcome' && (
                        <div className="w-full h-full bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4 overflow-y-auto">
                            <img src={logoBisa} alt="BISA" className="h-20 mb-3 drop-shadow-lg" onError={(e) => e.target.style.display = 'none'} />
                            <h1 className="text-5xl font-black text-[#003366] italic mb-1 text-center">BISA ATM</h1>
                            <p className="text-base text-[#003366]/80 font-medium italic tracking-wide text-center mb-8">
                                {t('welcome.title')}
                            </p>

                            {error && (
                                <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex gap-2">
                                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                                    <p className="text-red-600 text-sm font-semibold">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setStep('options')}
                                className="bg-yellow-400 text-slate-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-500 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                            >
                                {t('welcome.button')} <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* OPTIONS */}
                    {step === 'options' && (
                        <div className="w-full h-full flex flex-col items-center justify-between p-4 overflow-y-auto bg-white">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-slate-800 mb-4">{t('options.title')}</h2>
                            </div>

                            <button
                                onClick={iniciarOperacionQR}
                                disabled={cargando}
                                className="w-full max-w-md bg-white border-2 border-slate-300 rounded-2xl p-6 text-left hover:border-[#003366] hover:bg-blue-50 active:scale-95 transition-all shadow-lg"
                            >
                                <h3 className="text-2xl font-black text-[#003366] italic mb-2">{t('options.qr')}</h3>
                                <p className="text-slate-600 font-semibold">Retira dinero sin tarjeta de forma segura</p>
                            </button>

                            <button
                                onClick={reiniciarCajero}
                                className="w-full max-w-xs bg-slate-800 text-white rounded-full py-2 font-bold hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} /> {t('common.back')}
                            </button>
                        </div>
                    )}

                    {/* QR */}
                    {step === 'qr' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white overflow-y-auto">
                            <h2 className="text-3xl font-black text-slate-800 text-center mb-4">
                                {t('qr.title')} <br /> {t('qr.subtitle')}
                            </h2>

                            <div className="bg-slate-100 p-4 rounded-2xl border-2 border-slate-300 mb-4">
                                {codigoToken ? (
                                    <QRCode value={codigoToken} size={200} fgColor="#003366" />
                                ) : (
                                    <div className="w-52 h-52 flex items-center justify-center bg-slate-200 rounded-lg">
                                        <RefreshCw className="animate-spin text-slate-600" size={32} />
                                    </div>
                                )}
                            </div>

                            <p className="text-lg font-bold text-slate-700 mb-4">
                                {t('qr.timeLeft')} <span className={timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'}>{timeLeft}s</span>
                            </p>

                            <button
                                onClick={reiniciarCajero}
                                className="w-full max-w-xs bg-red-600 text-white rounded-full py-2 font-bold hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Delete size={18} /> {t('qr.cancel')}
                            </button>
                        </div>
                    )}

                    {/* PIN */}
                    {step === 'pin' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white overflow-y-auto">
                            <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">{t('pin.title')}</h2>

                            {pinError && (
                                <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-lg p-2 mb-3 text-red-600 text-sm font-bold text-center">
                                    {pinError}
                                </div>
                            )}
                            <div className="flex gap-4 mb-8 justify-center">
                                {[0, 1, 2, 3].map((idx) => (
                                    <div key={idx} className={`w-16 h-16 rounded-xl font-black text-2xl flex items-center justify-center shadow-md ${pin[idx] ? 'bg-[#003366] text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        {pin[idx] ? '●' : '○'}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-6 bg-slate-100 p-4 rounded-2xl w-full max-w-md shadow-lg border-2 border-slate-200">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'BORRAR', 0, 'ACEPTAR'].map((btn) => (
                                    <button
                                        key={btn}
                                        onClick={() => {
                                            if (btn === 'ACEPTAR') validarPin();
                                            else if (btn === 'BORRAR') setPin('');
                                            else addNumber(btn);
                                        }}
                                        className={`h-10 rounded font-bold text-xs flex items-center justify-center active:scale-95 transition-all ${
                                            btn === 'ACEPTAR' ? 'bg-green-500 text-white col-span-2' :
                                                btn === 'BORRAR' ? 'bg-red-500 text-white col-span-2' :
                                                    'bg-white text-slate-800 border border-slate-300'
                                        }`}
                                    >
                                        {btn === 'BORRAR' ? <Delete size={16} /> : btn === 'ACEPTAR' ? '✓' : btn}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={reiniciarCajero}
                                className="w-full max-w-xs bg-red-600 text-white rounded-full py-2 font-bold hover:bg-red-700 active:scale-95 transition-all"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    )}

                    {/* MAIN MENU */}
                    {step === 'main_menu' && (
                        <div className="w-full h-full flex flex-col items-center justify-between p-4 bg-white overflow-y-auto">
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-slate-800 mb-2">{t('menu.title')}</h2>
                                <p className="text-sm font-semibold text-slate-600">{t('menu.subtitle')}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl px-4">
                                <button
                                    onClick={abrirRetiro}
                                    className="bg-green-500 text-white rounded-3xl p-8 font-black text-lg hover:bg-green-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-4 shadow-xl border-b-4 border-green-700"
                                >
                                    <DollarSign size={40} />
                                    <span className="uppercase tracking-tight">{t('menu.withdraw')}</span>
                                </button>
                                <button
                                    onClick={() => setStep('validator')}
                                    className="bg-[#003366] text-white rounded-3xl p-8 font-black text-lg hover:bg-[#002244] active:scale-95 transition-all flex flex-col items-center justify-center gap-4 shadow-xl border-b-4 border-[#001122]"
                                >
                                    <Camera size={40} />
                                    <span className="uppercase tracking-tight">{t('menu.validator')}</span>
                                </button>
                                <button
                                    onClick={() => mostrarOpcionEnDesarrollo('Mini Extracto')}
                                    className="bg-slate-200 text-slate-500 rounded-3xl p-8 font-black text-lg opacity-80 cursor-not-allowed flex flex-col items-center justify-center gap-4 border-b-4 border-slate-300"
                                >
                                    <Receipt size={40} />
                                    <span className="uppercase tracking-tight">{t('menu.statement')}</span>
                                </button>
                                <button
                                    onClick={() => mostrarOpcionEnDesarrollo('Transferencias')}
                                    className="bg-slate-200 text-slate-500 rounded-3xl p-8 font-black text-lg opacity-80 cursor-not-allowed flex flex-col items-center justify-center gap-4 border-b-4 border-slate-300"
                                >
                                    <RefreshCw size={40} />
                                    <span className="uppercase tracking-tight">{t('menu.transfer')}</span>
                                </button>
                            </div>

                            <button
                                onClick={reiniciarCajero}
                                className="w-full max-w-sm bg-red-600 text-white rounded-full py-2 font-bold hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Delete size={18} /> {t('menu.logout')}
                            </button>
                        </div>
                    )}

                    {/* VALIDATOR */}
                    {step === 'validator' && (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <DetectorBilletes onClose={() => setStep('main_menu')} />
                        </div>
                    )}

                    {/* TIMEOUT */}
                    {step === 'timeout' && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-white p-4">
                            <AlertCircle size={64} className="text-red-600 mb-4 animate-bounce" />
                            <h2 className="text-2xl font-black text-slate-800 mb-4">{t('timeout.title')}</h2>
                            <button
                                onClick={reiniciarCajero}
                                className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <ArrowLeft size={18} /> {t('timeout.back')}
                            </button>
                        </div>
                    )}

                    {/* WITHDRAW AMOUNT */}
                    {step === 'withdraw_amount' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white overflow-y-auto">
                            <h2 className="text-3xl font-black text-slate-800 mb-2">{t('withdraw.title')}</h2>
                            <p className="text-sm font-semibold text-slate-600 mb-4">{t('withdraw.subtitle')}</p>

                            {retiroError && (
                                <div className="bg-red-100 border border-red-300 text-red-600 px-4 py-2 rounded-lg font-bold mb-4 flex items-center justify-center gap-2 w-full max-w-xs text-center text-sm">
                                    <AlertCircle size={18} /> {retiroError}
                                </div>
                            )}

                            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4 w-full max-w-xs text-center">
                                <p className="text-2xl font-black text-blue-600">{t('withdraw.amount')} {retiroMonto || '0'}</p>
                            </div>

                            <div className="flex gap-2 mb-4 flex-wrap justify-center w-full max-w-xs">
                                {[50, 100, 200, 500].map(valor => (
                                    <button
                                        key={valor}
                                        onClick={() => setRetiroMonto(String(valor))}
                                        className="px-3 py-1 bg-white border-2 border-slate-300 rounded-lg text-sm font-bold text-slate-800 hover:border-blue-600 hover:bg-blue-50 active:scale-95 transition-all"
                                    >
                                        {valor}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-100 p-3 rounded-lg w-full max-w-xs">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'BORRAR', 0, 'ACEPTAR'].map((btn) => (
                                    <button
                                        key={btn}
                                        onClick={() => {
                                            if (btn === 'ACEPTAR') solicitarRetiro();
                                            else if (btn === 'BORRAR') borrarRetiro();
                                            else agregarDigitoRetiro(btn);
                                        }}
                                        className={`h-10 rounded font-bold text-xs flex items-center justify-center active:scale-95 transition-all ${
                                            btn === 'ACEPTAR' ? 'bg-green-500 text-white col-span-2' :
                                                btn === 'BORRAR' ? 'bg-red-500 text-white col-span-2' :
                                                    'bg-white text-slate-800 border border-slate-300'
                                        }`}
                                    >
                                        {btn === 'BORRAR' ? <Delete size={14} /> : btn === 'ACEPTAR' ? '✓' : btn}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep('main_menu')}
                                className="w-full max-w-xs bg-slate-800 text-white rounded-full py-2 font-bold hover:bg-slate-900 active:scale-95 transition-all"
                            >
                                {t('withdraw.return')}
                            </button>
                        </div>
                    )}

                    {/* WITHDRAW PREVIEW */}
                    {step === 'withdraw_preview' && retiroResultado && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white overflow-y-auto">
                            <h2 className="text-lg font-black text-slate-800 mb-3">{t('withdraw.confirm')}</h2>
                            <p className="text-sm text-slate-600 mb-3">{t('withdraw.amount')} {retiroResultado.montoSolicitado}</p>

                            <div className="w-full max-w-xs bg-slate-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto border border-slate-200">
                                {retiroResultado.detalles.map((detalle, idx) => (
                                    <div key={idx} className="text-xs text-slate-700 mb-2 pb-2 border-b last:border-0">
                                        <p className="font-bold">{detalle.cantidad} x Bs {detalle.denominacion}</p>
                                        <p className="text-slate-500">{detalle.numerosSerie.slice(0, 2).join(', ')}...</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 w-full max-w-xs">
                                <button
                                    onClick={cancelarRetiro}
                                    className="flex-1 bg-red-600 text-white rounded-lg py-2 font-bold hover:bg-red-700 active:scale-95 transition-all text-sm"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={confirmarRetiro}
                                    disabled={cargando}
                                    className="flex-1 bg-green-600 text-white rounded-lg py-2 font-bold hover:bg-green-700 active:scale-95 transition-all text-sm disabled:opacity-50"
                                >
                                    {cargando ? '...' : t('withdraw.confirmBtn')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* WITHDRAW SUCCESS */}
                    {step === 'withdraw_success' && retiroResultado && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white">
                            <DollarSign size={48} className="text-green-600 mb-2" />
                            <h2 className="text-3xl font-black text-green-600 mb-1">{t('withdraw.success')}</h2>
                            <p className="text-sm text-slate-600 mb-4">{t('withdraw.amount')} {retiroResultado.montoDispensado}</p>

                            <div className="w-full max-w-xs bg-slate-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto border border-slate-200">
                                {retiroResultado.detalles.map((detalle, idx) => (
                                    <div key={idx} className="text-xs text-slate-700 mb-2 pb-2 border-b last:border-0">
                                        <p className="font-bold">{detalle.cantidad} x Bs {detalle.denominacion}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={volverAlMenuTrasRetiro}
                                className="w-full max-w-xs bg-blue-600 text-white rounded-full py-2 font-bold hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                {t('withdraw.back')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Slot para dinero */}
                <div className="w-12 h-full bg-black border-l border-slate-700 flex flex-col justify-around py-2">
                    <div className="w-16 h-4 bg-slate-600 rounded-full"></div>
                    <div className="w-16 h-4 bg-slate-600 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default AtmInterface;