import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Camera, AlertTriangle, CheckCircle, Type, X, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DetectorBilletes = ({ onClose }) => {
    const { apiCall } = useAuth();
    const webcamRef = useRef(null);

    const [denominacion, setDenominacion] = useState('50');
    const serieFija = 'B';

    const [numeroLectura, setNumeroLectura] = useState('');
    const [escaneando, setEscaneando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [modoManual, setModoManual] = useState(false);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "environment"
    };

    const capturarYLeer = async () => {
        setEscaneando(true);
        setResultado(null);

        const imageSrc = webcamRef.current.getScreenshot();

        try {
            const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng');
            const numerosEncontrados = text.match(/\d{7,9}/);

            if (numerosEncontrados) {
                const numeroExtraido = numerosEncontrados[0];
                setNumeroLectura(numeroExtraido);
                await consultarBackend(denominacion, serieFija, numeroExtraido);
            } else {
                setResultado({
                    tipo: 'advertencia',
                    titulo: 'No se detectó el número',
                    mensaje: "Acerque el billete o ingrese el código con el teclado."
                });
            }
        } catch (error) {
            setResultado({ tipo: 'peligro', titulo: 'Error', mensaje: "Ocurrió un problema con el escáner." });
        } finally {
            setEscaneando(false);
        }
    };

    const consultarBackend = async (denom, ser, num) => {
        try {
            const res = await apiCall(`/api/qr/validar-fisico?denominacion=${denom}&serie=${ser}&numero=${num}`);
            const data = await res.json();

            setResultado({
                tipo: data.valido ? 'exito' : 'peligro',
                titulo: data.valido ? 'BILLETE LEGAL' : 'BILLETE INHABILITADO',
                mensaje: data.mensaje
            });
        } catch (error) {
            setResultado({ tipo: 'peligro', titulo: 'Error de conexión', mensaje: "No se pudo conectar." });
        }
    };

    const handleValidacionManual = (e) => {
        e.preventDefault();
        consultarBackend(denominacion, serieFija, numeroLectura);
    };

    return (
        <div className="bg-slate-900 p-5 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl h-full max-h-[520px] mx-auto text-white relative animate-in zoom-in-95 border-2 border-slate-700">

            <button onClick={onClose} className="absolute top-4 right-4 bg-white/10 hover:bg-red-500 p-1.5 rounded-full transition-colors active:scale-95 z-50">
                <X size={18} />
            </button>

            <h3 className="text-lg font-black text-[#f5d000] mb-3 uppercase tracking-widest text-center w-full">Detector de Billetes</h3>

            <div className="flex gap-3 mb-3 w-full shrink-0">
                <div className="flex-1 flex flex-col">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Corte del billete</label>
                    {/* 🚀 SELECTOR RECUPERADO CON DISEÑO COMPACTO */}
                    <select
                        value={denominacion}
                        onChange={e => setDenominacion(e.target.value)}
                        className="bg-slate-800 text-white text-base font-bold p-2.5 rounded-lg border border-slate-600 outline-none focus:border-[#f5d000] cursor-pointer"
                    >
                        <option value="10">Bs 10</option>
                        <option value="20">Bs 20</option>
                        <option value="50">Bs 50</option>
                    </select>
                </div>
                <div className="w-1/3 flex flex-col">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Serie Oficial</label>
                    <div className="bg-slate-800 text-slate-300 text-base font-black p-2.5 rounded-lg border border-slate-700 flex items-center justify-center opacity-80 select-none">
                        Serie {serieFija}
                    </div>
                </div>
            </div>

            {!modoManual ? (
                <>
                    <div className="flex-1 min-h-0 w-full bg-black rounded-xl overflow-hidden relative border-2 border-slate-700 mb-3 shadow-inner">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute inset-0 border-2 border-[#004a8e]/30 flex items-center justify-center pointer-events-none">
                            <div className="w-1/2 h-1/3 border-2 border-[#f5d000] border-dashed rounded-lg shadow-[0_0_15px_#f5d000] bg-[#f5d000]/10"></div>
                        </div>
                    </div>

                    <button onClick={capturarYLeer} disabled={escaneando} className="shrink-0 w-full bg-[#004a8e] hover:bg-blue-800 text-white text-base font-black py-3 rounded-xl mb-2 flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg border-b-4 border-blue-900">
                        {escaneando ? <span className="animate-pulse">Analizando...</span> : <><Camera size={20}/> Escanear Número</>}
                    </button>
                </>
            ) : (
                <div className="flex-1 flex flex-col justify-center">
                    <form onSubmit={handleValidacionManual} className="w-full flex flex-col gap-3">
                        <input
                            type="number"
                            placeholder="Ej: 87280145"
                            value={numeroLectura}
                            onChange={e => setNumeroLectura(e.target.value)}
                            className="w-full bg-slate-800 text-center text-3xl tracking-[0.2em] font-mono p-4 rounded-xl border-2 border-slate-600 outline-none focus:border-[#f5d000] transition-colors"
                            required
                        />
                        <button type="submit" className="w-full bg-[#004a8e] text-white text-base font-black py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg border-b-4 border-blue-900">
                            Verificar Código
                        </button>
                    </form>
                </div>
            )}

            <button onClick={() => { setModoManual(!modoManual); setResultado(null); }} className="shrink-0 text-slate-400 text-[10px] font-bold uppercase mb-2 hover:text-white flex items-center gap-1 transition-colors mx-auto">
                <Type size={14} /> {modoManual ? 'Cambiar a Cámara' : 'Ingresar con teclado'}
            </button>

            {resultado && (
                <div className={`shrink-0 w-full p-3 rounded-xl border-2 flex items-center gap-3 animate-in slide-in-from-bottom-1 ${
                    resultado.tipo === 'exito' ? 'bg-green-900/40 border-green-500 text-green-400' :
                    resultado.tipo === 'peligro' ? 'bg-red-900/40 border-red-500 text-red-400' :
                    'bg-yellow-900/40 border-yellow-500 text-yellow-400'
                }`}>
                    {resultado.tipo === 'exito' && <CheckCircle size={24} className="shrink-0" />}
                    {resultado.tipo === 'peligro' && <AlertTriangle size={24} className="shrink-0" />}
                    {resultado.tipo === 'advertencia' && <Info size={24} className="shrink-0" />}

                    <div>
                        <p className="font-black text-sm uppercase tracking-wide">{resultado.titulo}</p>
                        <p className="text-[10px] font-medium leading-tight opacity-90">{resultado.mensaje}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetectorBilletes;