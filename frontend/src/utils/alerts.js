import Swal from 'sweetalert2';

// COLORES CORPORATIVOS BANCO BISA
const THEME = {
    background: '#ffffff',      // Fondo blanco limpio
    color: '#334155',           // Texto gris oscuro para mejor lectura
    confirmButton: '#004a8e',   // Azul BISA para botones de confirmación
    cancelButton: '#ef4444',    // Rojo para cancelar/eliminar
    accent: '#f5d000',          // Amarillo BISA para íconos
    title: '#003366',           // Azul extra oscuro para títulos
    cancelGray: '#94a3b8'       // Gris neutro para botón de cancelar normal
};

export const showError = (msg) => {
    Swal.fire({
        icon: 'error',
        title: `<h2 style="color: ${THEME.title}; margin: 0; font-weight: 900;">Error</h2>`,
        text: msg,
        background: THEME.background,
        color: THEME.color,
        confirmButtonColor: THEME.confirmButton,
        confirmButtonText: 'Entendido',
        // Opcional: Si usas Tailwind, redondea los bordes de la alerta
        customClass: { popup: 'rounded-3xl shadow-2xl' }
    });
};

export const showSuccess = (title, text = '') => {
    Swal.fire({
        icon: 'success',
        title: `<h2 style="color: ${THEME.title}; margin: 0; font-weight: 900;">${title}</h2>`,
        html: text,
        timer: 3000,
        showConfirmButton: false,
        background: THEME.background,
        color: THEME.color,
        iconColor: '#10b981', // Verde esmeralda para el check de éxito
        customClass: { popup: 'rounded-3xl shadow-2xl border-t-4 border-[#004a8e]' }
    });
};

export const showCredentials = (username, password) => {
    Swal.fire({
        title: `<h2 style="color: ${THEME.title}; margin: 0; font-weight: 900;">¡Cuenta Activada!</h2>`,
        html: `
            <div style="text-align: left; background: #f0f4f8; padding: 20px; border-radius: 12px; border-left: 6px solid ${THEME.accent}; margin-top: 15px;">
                <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">Usuario: <br/><strong style="color: ${THEME.title}; font-size: 18px;">${username}</strong></p>
                <p style="margin: 0; color: #475569; font-size: 14px;">Clave de Acceso: <br/>
                    <strong style="color: #004a8e; font-size: 22px; background: #fff; padding: 6px 12px; border-radius: 8px; border: 1px solid #cce0ff; display: inline-block; margin-top: 5px; letter-spacing: 2px;">
                        ${password}
                    </strong>
                </p>
                <div style="background: #fffbe2; border-left: 3px solid #f5d000; padding: 8px; margin-top: 15px; border-radius: 4px;">
                    <small style="color: #856404; display: block; font-weight: 600;">⚠️ Por seguridad, entregue esta clave al cliente. El sistema le pedirá cambiarla en su primer ingreso.</small>
                </div>
            </div>
        `,
        icon: 'success',
        iconColor: THEME.accent,
        background: THEME.background,
        color: THEME.color,
        confirmButtonText: 'Entendido',
        confirmButtonColor: THEME.confirmButton,
        customClass: { popup: 'rounded-3xl shadow-2xl' }
    });
};

export const confirmAction = async ({
    title = '¿Estás seguro?',
    text = 'Esta acción requerirá confirmación.',
    confirmText = 'Sí, continuar',
    isDestructive = false
} = {}) => {
    const result = await Swal.fire({
        title: `<h2 style="color: ${THEME.title}; margin: 0; font-weight: 900;">${title}</h2>`,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        background: THEME.background,
        color: THEME.color,
        confirmButtonColor: isDestructive ? THEME.cancelButton : THEME.confirmButton,
        cancelButtonColor: THEME.cancelGray,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar',
        iconColor: THEME.accent,
        customClass: { popup: 'rounded-3xl shadow-2xl' }
    });

    return result.isConfirmed;
};