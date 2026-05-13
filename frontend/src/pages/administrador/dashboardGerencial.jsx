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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'No se pudo cargar el dashboard gerencial');
            }

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
        </div>
    );
};

export default DashboardGerencial;