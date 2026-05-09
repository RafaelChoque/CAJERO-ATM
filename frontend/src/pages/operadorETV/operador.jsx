import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import VistaBovedas from './vistaBovedas';

const Operador = () => {
    const [vistaActiva, setVistaActiva] = useState('bovedas');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50 overflow-hidden relative">
            <Sidebar
                setVistaActiva={setVistaActiva}
                vistaActiva={vistaActiva}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            <div className={`flex-1 transition-all duration-300 w-full ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <main className="min-h-screen pt-16 lg:pt-0">
                    {vistaActiva === 'bovedas' && <VistaBovedas />}
                </main>
            </div>
        </div>
    );
};

export default Operador;