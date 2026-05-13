import React, { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Landmark,
    CreditCard,
    Wrench,
    AlertTriangle,
    ArrowDownCircle,
    ArrowRightLeft,
    RefreshCw,
    ReceiptText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../utils/alerts';

const DashboardGerencial = () => {
    const { apiCall } = useAuth();

    const [dashboard, setDashboard] = useState(null);
    const [metricasColas, setMetricasColas] = useState([]);
    const [metricasMarkov, setMetricasMarkov] = useState([]);
    const [metricasAgotamiento, setMetricasAgotamiento] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const formatearMonto = (valor) => {
        const numero = Number(valor || 0);
        return new Intl.NumberFormat('es-BO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numero);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime())) return fecha;
        return new Intl.DateTimeFormat('es-BO', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(date);
    };

    const cargarDashboard = async (mostrarToast = false) => {
        try {
            setCargando(true);
            setError(null);

            const response = await apiCall('/api/admin/dashboard', {
                method: 'GET'
            });
            const responseColas = await apiCall('/api/admin/dashboard/metricas-colas', { method: 'GET' });
            const responseMarkov = await apiCall('/api/admin/dashboard/metricas-markov', { method: 'GET' });
            const responseAgotamiento = await apiCall('/api/admin/dashboard/metricas-agotamiento', { method: 'GET' });
            const data = await response.json();
            const dataColas = await responseColas.json();
            const dataMarkov = await responseMarkov.json();
            const dataAgotamiento = await responseAgotamiento.json();

            if (!response.ok) {
                throw new Error(data?.message || 'No se pudo cargar el dashboard gerencial');
            }
            setMetricasColas(dataColas);
            setMetricasMarkov(dataMarkov);
            setMetricasAgotamiento(dataAgotamiento);
            setDashboard(data);

            if (mostrarToast) {
                showSuccess('Actualizado', 'El dashboard gerencial fue actualizado correctamente.');
            }
        } catch (err) {
            const mensaje = err.message || 'No se pudo cargar el dashboard gerencial';
            setError(mensaje);
            showError('Error', mensaje);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDashboard();
    }, []);

    const metricas = useMemo(() => {
        if (!dashboard) return [];

        return [
            {
                titulo: 'Clientes activos',
                valor: dashboard.totalClientesActivos ?? 0,
                icono: Users,
                color: 'text-blue-600',
                fondo: 'bg-blue-50'
            },
            {
                titulo: 'Cuentas registradas',
                valor: dashboard.totalCuentas ?? 0,
                icono: CreditCard,
                color: 'text-emerald-600',
                fondo: 'bg-emerald-50'
            },
            {
                titulo: 'Cajeros activos',
                valor: dashboard.totalCajerosActivos ?? 0,
                icono: Landmark,
                color: 'text-indigo-600',
                fondo: 'bg-indigo-50'
            },
            {
                titulo: 'En mantenimiento',
                valor: dashboard.totalCajerosMantenimiento ?? 0,
                icono: Wrench,
                color: 'text-amber-600',
                fondo: 'bg-amber-50'
            },
            {
                titulo: 'Alertas stock bajo',
                valor: dashboard.totalAlertasStockBajo ?? 0,
                icono: AlertTriangle,
                color: 'text-red-600',
                fondo: 'bg-red-50'
            }
        ];
    }, [dashboard]);

    if (cargando) {
        return (
            <div className="p-6 lg:p-8">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                    <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-lg font-semibold text-gray-700">Cargando dashboard gerencial...</p>
                </div>
            </div>
        );
    }

    if (error || !dashboard) {
        return (
            <div className="p-6 lg:p-8">
                <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
                    <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" />
                    <p className="text-lg font-semibold text-red-600">
                        {error || 'No se pudo cargar el dashboard'}
                    </p>
                    <button
                        onClick={() => cargarDashboard()}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-800">
                        Dashboard Gerencial
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Resumen general del sistema ATM BISA.
                    </p>
                </div>

                <button
                    onClick={() => cargarDashboard(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {metricas.map((item) => {
                    const Icono = item.icono;
                    return (
                        <div
                            key={item.titulo}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${item.fondo}`}>
                                    <Icono className={`h-6 w-6 ${item.color}`} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-500">{item.titulo}</p>
                            <h2 className="text-3xl font-black text-gray-800 mt-1">
                                {item.valor}
                            </h2>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-xl bg-red-50">
                            <ArrowDownCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Monto total retiros</p>
                            <h3 className="text-2xl font-black text-gray-800">
                                Bs {formatearMonto(dashboard.montoTotalRetiros)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-xl bg-orange-50">
                            <ArrowRightLeft className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Transferencias enviadas</p>
                            <h3 className="text-2xl font-black text-gray-800">
                                Bs {formatearMonto(dashboard.montoTotalTransferenciasEnviadas)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-emerald-50">
                            <Landmark className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Cajeros más utilizados</p>
                            <h3 className="text-lg font-black text-gray-800">
                                Últimos 30 días
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {dashboard.topCajerosUtilizados?.length > 0 ? (
                            dashboard.topCajerosUtilizados.map((cajero, index) => (
                                <div
                                    key={cajero.idCajero}
                                    className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0"
                                >
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            #{index + 1} - {cajero.codigoCajero}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {cajero.cantidadRetiros} retiros
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600">
                                            Bs {formatearMonto(cajero.montoTotalRetirado)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">
                                No hay datos de uso en los últimos 30 días.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100">
                        <ReceiptText className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">Últimas transacciones</h2>
                        <p className="text-sm text-gray-500">Resumen de los últimos movimientos registrados</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600">
                            <th className="px-4 py-3 font-semibold">ID</th>
                            <th className="px-4 py-3 font-semibold">Referencia</th>
                            <th className="px-4 py-3 font-semibold">Tipo</th>
                            <th className="px-4 py-3 font-semibold">Monto</th>
                            <th className="px-4 py-3 font-semibold">Saldo resultante</th>
                            <th className="px-4 py-3 font-semibold">Estado</th>
                            <th className="px-4 py-3 font-semibold">Cuenta</th>
                            <th className="px-4 py-3 font-semibold">Cajero</th>
                            <th className="px-4 py-3 font-semibold">Fecha</th>
                        </tr>
                        </thead>
                        <tbody>
                        {dashboard.ultimasTransacciones?.length > 0 ? (
                            dashboard.ultimasTransacciones.map((tx) => (
                                <tr
                                    key={tx.idTransaccion}
                                    className="border-t border-gray-100 hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3 font-medium text-gray-700">
                                        {tx.idTransaccion}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                        {tx.numeroReferencia}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                        {tx.tipoTransaccion}
                                    </td>
                                    <td className={`px-4 py-3 font-bold whitespace-nowrap ${Number(tx.monto) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        Bs {formatearMonto(tx.monto)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                        Bs {formatearMonto(tx.saldoResultante)}
                                    </td>
                                    <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                    tx.estado === 'COMPLETADA'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {tx.estado}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {tx.idCuenta ?? '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {tx.idCajero ?? '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                        {formatearFecha(tx.fechaHora)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                    No hay transacciones recientes para mostrar.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Análisis de Colas (M/M/1) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Análisis de Colas y Saturación (M/M/1)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metricasColas.map(metrica => (
                        <div key={metrica.idCajero} className="p-4 border border-gray-100 rounded-xl shadow-sm bg-gray-50">
                            <h4 className="font-bold text-lg text-indigo-700">Cajero: {metrica.codigoCajero}</h4>
                            <div className="mt-2 text-sm text-gray-600">
                                <p><strong>Factor de uso (ρ):</strong> {metrica.rho.toFixed(2)}%</p>
                                <p><strong>Clientes en fila (Lq):</strong> {metrica.lq.toFixed(1)} personas</p>
                                <p><strong>Espera promedio (Wq):</strong> {metrica.wq.toFixed(1)} minutos</p>
                            </div>

                            <div className={`mt-3 p-2 rounded text-sm font-semibold ${metrica.rho > 80 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                                Status: {metrica.alerta}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Análisis Cadenas de Markov */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Predicción de Estados a Largo Plazo - Cadenas de Markov</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metricasMarkov && metricasMarkov.length > 0 ? (
                        metricasMarkov.map(metrica => (
                            <div key={metrica.idCajero} className="p-4 border border-gray-100 rounded-xl shadow-sm bg-slate-50">
                                <h4 className="font-bold text-lg text-indigo-700 mb-2">Cajero: {metrica.codigoCajero}</h4>
                                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Estado actual: <span className="font-bold">{metrica.estadoActual}</span></p>

                                <div className="space-y-2 text-sm font-medium">
                                    <div className="flex justify-between items-center bg-green-50 text-green-700 p-2 rounded border border-green-200">
                                        <span>✓ Óptimo/Operativo:</span>
                                        <span className="font-black">{metrica.probOptimo.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-orange-50 text-orange-700 p-2 rounded border border-orange-200">
                                        <span>⚠ Bajo Stock (Riesgo):</span>
                                        <span className="font-black">{metrica.probRiesgo.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-red-50 text-red-700 p-2 rounded border border-red-200">
                                        <span>✗ Falla/Mantenimiento:</span>
                                        <span className="font-black">{metrica.probMantenimiento.toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-300">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">💡 Recomendación IA:</p>
                                    <p className={`text-sm font-bold rounded-lg p-2 ${
                                        metrica.probMantenimiento > 15
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                        {metrica.recomendacionPredictiva}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            <p>No hay datos de predicción disponibles.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Predicción de Agotamiento de Dinero */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">⏰ Predicción de Agotamiento de Efectivo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metricasAgotamiento && metricasAgotamiento.length > 0 ? (
                        metricasAgotamiento.map(pred => (
                            <div key={pred.idCajero} className="p-4 border-2 border-gray-100 rounded-xl shadow-sm">
                                <h4 className="font-bold text-lg text-indigo-700 mb-3">{pred.codigoCajero}</h4>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Dinero disponible:</span>
                                        <span className="font-black text-blue-600">Bs {pred.totalBilletes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Promedio/día:</span>
                                        <span className="font-black">Bs {pred.promedioBilletesXDia}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Retirados hoy:</span>
                                        <span className="font-black text-orange-600">Bs {pred.billetesRetiradosHoy}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t-2 border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Predicción:</p>
                                    <p className={`text-2xl font-black ${
                                        pred.diasHastaAgotamiento <= 1 ? 'text-red-600' :
                                            pred.diasHastaAgotamiento <= 3 ? 'text-orange-600' :
                                                pred.diasHastaAgotamiento <= 7 ? 'text-yellow-600' :
                                                    'text-green-600'
                                    }`}>
                                        {pred.diasHastaAgotamiento === 999 ? '∞' : pred.diasHastaAgotamiento} días
                                    </p>
                                </div>

                                <div className={`mt-3 p-2 rounded-lg text-xs font-bold text-center ${
                                    pred.diasHastaAgotamiento <= 1 ? 'bg-red-100 text-red-700' :
                                        pred.diasHastaAgotamiento <= 3 ? 'bg-orange-100 text-orange-700' :
                                            pred.diasHastaAgotamiento <= 7 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                }`}>
                                    {pred.estado}
                                </div>

                                <p className="text-xs text-gray-600 mt-3 italic">{pred.alerta}</p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            Sin datos de predicción.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default DashboardGerencial;
