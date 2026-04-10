package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Entities.TokenQr;
import com.bisa.atm.Entities.TarjetaVirtual;
import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.Repositories.TokenQrRepository;
import com.bisa.atm.Repositories.TarjetaVirtualRepository;
import com.bisa.atm.Repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class TokenQrService {

    @Autowired
    private TokenQrRepository tokenQrRepository;

    @Autowired
    private CajeroRepository cajeroRepository;

    @Autowired
    private CuentaBancariaRepository cuentaRepository;

    @Autowired
    private TarjetaVirtualRepository tarjetaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Genera un nuevo token QR para un cajero específico
    @Transactional
    public String generarToken(Long idCajero) {
        Cajero cajero = cajeroRepository.findById(idCajero)
                .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));

        TokenQr token = new TokenQr(cajero);

        tokenQrRepository.save(token);
        return token.getCodigoToken();
    }

    // Vincula un token QR a una cuenta bancaria específica y notifica al cliente
    @Transactional
    public void vincularToken(String codigoToken, Long idCuenta) {
        TokenQr token = tokenQrRepository.findByCodigoToken(codigoToken)
                .orElseThrow(() -> new RuntimeException("Código QR inválido."));

        CuentaBancaria cuenta = cuentaRepository.findById(idCuenta)
                .orElseThrow(() -> new RuntimeException("Cuenta bancaria no encontrada."));

        token.vincular(cuenta);
        tokenQrRepository.save(token);

        Map<String, Object> mensaje = new HashMap<>();
        mensaje.put("estado", "VINCULADO");
        mensaje.put("idCuenta", cuenta.getIdCuenta());

        messagingTemplate.convertAndSend("/topic/qr/" + codigoToken, (Object) mensaje);
    }

    //revisa el estado del qr o si ya fue escaneado
    public Map<String, Object> consultarEstado(String codigoToken) {
        TokenQr token = tokenQrRepository.findByCodigoToken(codigoToken)
                .orElseThrow(() -> new RuntimeException("Código QR no encontrado."));
        token.verificarYExpirar();
        tokenQrRepository.save(token);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("estado", token.getEstado());

        if ("VINCULADO".equals(token.getEstado()) && token.getCuenta() != null) {
            respuesta.put("idCuenta", token.getCuenta().getIdCuenta());
        }

        return respuesta;
    }

    // verifica intentos, bloquea cuentas y lanza alertas de seguriodad
    public void validarPinCajero(Long idCuenta, String pinIngresado) {
        TarjetaVirtual tarjeta = tarjetaRepository.findByCuenta_IdCuenta(idCuenta)
                .orElseThrow(() -> new RuntimeException("Tarjeta no encontrada para esta cuenta."));

        Usuario usuario = tarjeta.getCuenta().getUsuario();
        String estadoUsuario = usuario.getEstado();

        // si ya esta bloqueado no se permite
        if ("ELIMINADO".equals(estadoUsuario) || "BLOQUEADO".equals(estadoUsuario) || "INACTIVO".equals(estadoUsuario)) {
            throw new RuntimeException("Operación denegada. Cuenta bloqueada o inactiva.");
        }

        // si fallo pin se suma un strike
        if (!tarjeta.getHashPin().equals(pinIngresado)) {
            usuario.setIntentosFallidos(usuario.getIntentosFallidos() + 1);

            // si llega a 3 se bloquea
            if (usuario.getIntentosFallidos() >= 3) {
                usuario.setEstado("BLOQUEADO");
                usuario.setFechaDesbloqueo(LocalDateTime.now().plusHours(24));
                usuarioRepository.save(usuario);

                // Enviar alerta de seguridad al cliente desde la app
                Map<String, Object> alertaSeguridad = new HashMap<>();
                alertaSeguridad.put("accion", "CERRAR_SESION");
                alertaSeguridad.put("motivo", "Por seguridad, tu sesión ha sido cerrada debido a múltiples intentos fallidos de PIN en el cajero.");
                messagingTemplate.convertAndSend("/topic/seguridad/" + idCuenta, (Object) alertaSeguridad);

                throw new RuntimeException("PIN Incorrecto. Tu cuenta ha sido bloqueada.");
            }

            usuarioRepository.save(usuario);
            throw new RuntimeException("PIN Incorrecto");
        }

        //si el pin es correcto se resetea los intentos
        if (usuario.getIntentosFallidos() > 0) {
            usuario.setIntentosFallidos(0);
            usuarioRepository.save(usuario);
        }
    }
}