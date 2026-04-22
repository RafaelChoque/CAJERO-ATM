package com.bisa.atm.Services;

import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.Repositories.UsuarioRepository;
import com.bisa.atm.Security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AuthService {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private CustomUserDetailsService userDetailsService;
    @Autowired private CuentaBancariaRepository cuentaRepository;

    //login para admins
    public Map<String, String> loginAdmin(String username, String password) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (passwordEncoder.matches(password, usuario.getContrasena()) && usuario.getRol().equals("ADMINISTRADOR")) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getNombreUsuario());
            String token = jwtService.generarToken(userDetails);
            return Map.of("token", token, "redirect", "/admin/dashboard");
        }
        throw new RuntimeException("Acceso denegado: Credenciales inválidas");
    }

    // login para la app movil donde controla bloqueos, intentos y cambio de contraseña temporal
    public Map<String, Object> loginCliente(String username, String password, String dispositivoId) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar estado de la cuenta
        if ("BLOQUEADO".equals(usuario.getEstado())) {
            if (usuario.getFechaDesbloqueo() != null && LocalDateTime.now().isAfter(usuario.getFechaDesbloqueo())) {
                usuario.cambiarEstado("ACTIVO");
                usuarioRepository.save(usuario);
            } else {
                throw new RuntimeException("Por seguridad, tu cuenta está bloqueada. Intenta de nuevo en 24 horas.");
            }
        }

        // se revisa si la cuenta está eliminada o inactiva desde el panel de control
        if ("ELIMINADO".equals(usuario.getEstado()) || "INACTIVO".equals(usuario.getEstado())) {
            throw new RuntimeException("Esta cuenta ha sido dada de baja. Comunícate con el banco.");
        }

        //verifica contraseña encriptada
        if (passwordEncoder.matches(password, usuario.getContrasena()) && usuario.getRol().equals("CLIENTE")) {

            // Si el login es exitoso, se resetea los intentos fallidos
            if (usuario.getIntentosFallidos() > 0) {
                usuario.setIntentosFallidos(0);
                usuarioRepository.save(usuario);
            }

            // Si es su primera vez se manda directo a cambiar la contraseña que le llegó al correo
            if (usuario.getDebeCambiarContrasena()) {
                return Map.of(
                        "mensaje", "Debe cambiar su contraseña temporal",
                        "requiereCambio", true,
                        "idUsuario", usuario.getIdUsuario()
                );
            }

            CuentaBancaria cuenta = cuentaRepository.findByUsuario_IdUsuario(usuario.getIdUsuario())
                    .orElseThrow(() -> new RuntimeException("El cliente no tiene cuenta asignada"));

            if (usuario.getUltimoTokenJwt() != null && !usuario.getUltimoTokenJwt().isEmpty()) {
                String dispositivoAnterior = usuario.getDispositivoIdentificador();
                if (dispositivoAnterior != null && !dispositivoAnterior.equals(dispositivoId)) {
                    throw new RuntimeException("Tu cuenta está siendo usada en otro dispositivo. Solo se permite un dispositivo activo por cuenta.");
                }
            }

            // generar el token JWT
            UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getNombreUsuario());
            String token = jwtService.generarToken(userDetails);

            usuario.setUltimoTokenJwt(token);
            usuario.setDispositivoIdentificador(dispositivoId);
            usuario.setFechaUltimoAcceso(LocalDateTime.now());
            usuarioRepository.save(usuario);

            //mapear solo lo que la app necesita para funcionar
            return Map.of(
                    "mensaje", "Login exitoso",
                    "requiereCambio", false,
                    "token", token,
                    "idUsuario", usuario.getIdUsuario(),
                    "nombre", usuario.getPersona().getNombre(),
                    "idCuenta", cuenta.getIdCuenta(),
                    "saldo", cuenta.getSaldo(),
                    "moneda", cuenta.getMoneda()
            );
        } else {
            usuario.setIntentosFallidos(usuario.getIntentosFallidos() + 1);

            //al tercer strike se bloquea la cuenta por 24 horas
            if (usuario.getIntentosFallidos() >= 3) {
                usuario.setEstado("BLOQUEADO");
                usuario.setFechaDesbloqueo(LocalDateTime.now().plusHours(24));
                usuarioRepository.save(usuario);
                throw new RuntimeException("Has fallado 3 veces. Tu cuenta ha sido bloqueada por 24 horas.");
            }

            usuarioRepository.save(usuario);
            throw new RuntimeException("Credenciales incorrectas. Intento " + usuario.getIntentosFallidos() + " de 3.");
        }
    }

    // se dispara cuando el cliente actualiza su contraseña por primera vez
    @Transactional
    public void cambiarPassword(Long idUsuario, String nuevaPassword) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setContrasena(passwordEncoder.encode(nuevaPassword)); //encripta
        usuario.setDebeCambiarContrasena(false); // le quita lo temporal
        usuarioRepository.save(usuario);
    }
}