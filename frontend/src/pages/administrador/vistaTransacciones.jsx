import React from 'react';
import { ClipboardList } from 'lucide-react';

const VistaTransacciones = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                <div className="bg-[#004a8e] p-3 rounded-xl">
                    <ClipboardList className="text-white" size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[#004a8e] uppercase tracking-tight">Auditoría LAN</h1>
                    <p className="text-gray-500 text-sm font-medium">Historial de movimientos del sistema.</p>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-2xl p-20 text-center border border-dashed border-gray-200">
                <div className="flex flex-col items-center gap-4 opacity-40">
                    <ClipboardList size={48} className="text-[#004a8e]" />
                    <p className="text-[#004a8e] font-black uppercase tracking-widest text-sm">
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VistaTransacciones;