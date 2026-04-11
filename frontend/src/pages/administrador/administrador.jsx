import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import VistaCajeros from './vistaCajeros';
import VistaClientes from './vistaClientes';
import VistaTransacciones from './vistaTransacciones';

// Este componente es solo el contenedor ("Wrapper").
// Tiene la barra lateral y cambia lo que muestra en el medio (Main) según lo que el usuario pulse.
const Administrador = () => {
    // Por defecto arranca mostrando la pantalla de los Cajeros
    const [vistaActiva, setVistaActiva] = useState('cajeros');

    // Estados para controlar si el menú lateral está escondido o no
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

            {/* El contenido principal que se encoge o se expande dependiendo si el menú está cerrado o abierto */}
            <div className={`flex-1 transition-all duration-300 w-full ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <main className="min-h-screen pt-16 lg:pt-0">
                    {/* Renderizado Condicional: Solo "dibuja" el componente que esté seleccionado */}
                    {vistaActiva === 'cajeros' && <VistaCajeros />}
                    {vistaActiva === 'clientes' && <VistaClientes />}
                    {vistaActiva === 'transacciones' && <VistaTransacciones />}
                </main>
            </div>
        </div>
    );
};

export default Administrador;