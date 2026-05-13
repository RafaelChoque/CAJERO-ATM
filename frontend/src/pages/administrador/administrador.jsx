import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import VistaCajeros from './vistaCajeros';
import VistaClientes from './vistaClientes';
import VistaTransacciones from './vistaTransacciones';
import VistaDispositivosDevices from './vistaDispositivosDevices';
import DashboardGerencial from './dashboardGerencial';

const Administrador = () => {

    const [vistaActiva, setVistaActiva] = useState('cajeros');

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
                    {vistaActiva === 'cajeros' && <VistaCajeros />}
                    {vistaActiva === 'clientes' && <VistaClientes />}
                    {vistaActiva === 'transacciones' && <VistaTransacciones />}
                    {vistaActiva === 'dispositivos' && <VistaDispositivosDevices />}
                    {vistaActiva === 'dashboard' && <DashboardGerencial />}
                </main>
            </div>
        </div>
    );
};

export default Administrador;