import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MonitorSmartphone,
  Users,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Truck,
  Smartphone
} from 'lucide-react';
import LogoBisa from '../assets/logo-bisa.png';

const Sidebar = ({ setVistaActiva, vistaActiva, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();

  // Cambia la vista y esconde el menú si estamos en un celular
  const handleMenuClick = (vista) => {
      setVistaActiva(vista);
      setIsMobileOpen(false);
  };

  // Lógica de diseño: Cambia el color del botón si es la vista que estamos viendo actualmente
  const getBtnClass = (id) => `
    w-full flex items-center py-3.5 text-sm rounded-xl transition-all duration-200
    ${isCollapsed && !isMobileOpen ? 'lg:justify-center px-0' : 'gap-x-4 px-5'}
    ${vistaActiva === id
      ? 'bg-[#004a8e] text-white font-bold shadow-lg shadow-blue-900/20'
      : 'text-gray-500 hover:bg-gray-100 hover:text-[#004a8e] font-semibold'}
  `;

  return (
    <>
      {/* Botón "Hamburguesa" que solo aparece en pantallas chiquitas (Móvil/Tablet) */}
      <div className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white shadow-sm border-b border-gray-200 px-5 py-3.5 flex justify-between items-center">
        <div className="flex items-center">
            <img src={LogoBisa} alt="Banco BISA" className="h-8 object-contain" />
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-[#004a8e] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Fondo oscuro desenfocado que aparece cuando el menú sale en el móvil */}
      {isMobileOpen && (
          <div
              className="fixed inset-0 bg-slate-900/50 z-[50] lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileOpen(false)}
          ></div>
      )}

      {/* El panel lateral real. En móvil se traslada desde la izquierda, en PC siempre está visible */}
      <div
        className={`fixed top-0 start-0 bottom-0 z-[60] bg-white border-e border-gray-100 shadow-2xl lg:shadow-none transition-all duration-300 transform h-full flex flex-col
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'w-[280px]'}
        `}
      >
        <div className="relative flex flex-col h-full max-h-full">

          {/* Logo y Botón para colapsar/expandir en PC */}
          <header className="py-6 relative flex items-center justify-center">
            {(!isCollapsed || isMobileOpen) && (
              <img src={LogoBisa} alt="Banco BISA" className="h-10 object-contain" />
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden lg:flex text-gray-400 hover:text-[#004a8e] hover:bg-blue-50 rounded-full p-2 transition-all ${!isCollapsed ? 'absolute right-4' : ''}`}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </header>

          <nav className="flex-1 overflow-y-auto py-4 px-5 space-y-3">
            {/* Enlaces de las vistas, solo visibles para el ADMINISTRADOR */}
            {user?.rol === 'ADMINISTRADOR' && (
              <>
                <button onClick={() => handleMenuClick('cajeros')} className={getBtnClass('cajeros')} title={isCollapsed && !isMobileOpen ? "Gestión ATMs" : ""}>
                  <MonitorSmartphone size={22} className="shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">Gestión ATMs</span>}
                </button>

                <button onClick={() => handleMenuClick('clientes')} className={getBtnClass('clientes')} title={isCollapsed && !isMobileOpen ? "Clientes" : ""}>
                  <Users size={22} className="shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">Cuentas y Clientes</span>}
                </button>

                <button onClick={() => handleMenuClick('transacciones')} className={getBtnClass('transacciones')} title={isCollapsed && !isMobileOpen ? "Auditoría" : ""}>
                  <ClipboardList size={22} className="shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">Auditoría LAN</span>}
                </button>

                <button onClick={() => handleMenuClick('dispositivos')} className={getBtnClass('dispositivos')} title={isCollapsed && !isMobileOpen ? "Dispositivos" : ""}>
                  <Smartphone size={22} className="shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">Dispositivos Bloqueados</span>}
                </button>

                <button onClick={() => handleMenuClick('dashboard')} className={getBtnClass('dashboard')} title={isCollapsed && !isMobileOpen ? "Dashboard Gerencial" : ""}>
                  <LayoutDashboard size={22} className="shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">Dashboard Gerencial</span>}
                </button>
              </>
            )}

            {/* Enlace de la vista, solo visible para el OPERADOR_ETV */}
            {user?.rol === 'OPERADOR_ETV' && (
              <button onClick={() => handleMenuClick('bovedas')} className={getBtnClass('bovedas')} title={isCollapsed && !isMobileOpen ? "Logística ETV" : ""}>
                <Truck size={22} className="shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">Logística ETV</span>}
              </button>
            )}
          </nav>

          {/* Sección de perfil y Logout en la parte inferior */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/80">
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-2xl bg-[#004a8e] flex items-center justify-center text-[#f5d000] font-black text-xl shadow-lg shadow-blue-900/20 shrink-0">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-4 overflow-hidden">
                  <p className="text-sm font-black text-[#004a8e] truncate leading-tight mb-1">
                    {user?.username || 'Usuario'}
                  </p>
                  <span className="text-[10px] bg-[#f5d000] text-[#004a8e] px-2.5 py-0.5 rounded-md font-black uppercase tracking-widest">
                    {user?.rol || 'Staff'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              className={`w-full flex items-center py-3.5 text-sm text-red-500 rounded-xl hover:bg-red-100 transition-all font-bold ${isCollapsed && !isMobileOpen ? 'justify-center' : 'gap-x-4 px-5'}`}
            >
              <LogOut size={20} className="shrink-0"/>
              {(!isCollapsed || isMobileOpen) && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;