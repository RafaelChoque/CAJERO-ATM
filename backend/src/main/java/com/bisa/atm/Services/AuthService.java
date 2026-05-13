package com.bisa.atm.Services;

import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.Repositories.UsuarioRepository;
import com.bisa.atm.Security.JwtService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final CuentaBancariaRepository cuentaRepository;
    private final DispositivoService dispositivoService;
    private final AuditoriaService auditoriaService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            CuentaBancariaRepository cuentaRepository,
            DispositivoService dispositivoService,
            AuditoriaService auditoriaService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.cuentaRepository = cuentaRepository;
        this.dispositivoService = dispositivoService;
        this.auditoriaService = auditoriaService;
    }

    public Map<String, String> loginAdmin(String username, String password) {
        try {
            Usuario usuario = usuarioRepository.findByNombreUsuario(username)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (passwordEncoder.matches(password, usuario.getContrasena()) &&
                    (usuario.getRol().equals("ADMINISTRADOR") || usuario.getRol().equals("OPERADOR_ETV"))) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getNombreUsuario());
                String token = jwtService.generarToken(userDetails);

                auditoriaService.registrar(
                        "AUTH",
                        "LOGIN_ADMIN",
                        "USUARIO",
                        usuario.getIdUsuario(),
                        "EXITOSO",
                        "Inicio de sesión exitoso de usuario administrativo",
                        null,
                        null,
                        null,
                        "{\"username\":\"" + username + "\",\"rol\":\"" + usuario.getRol() + "\"}"
                );

                return Map.of(
                        "token", token,
                        "rol", usuario.getRol(),
                        "redirect", usuario.getRol().equals("ADMINISTRADOR") ? "/admin/dashboard" : "/etv/dashboard"
                );
            }

            auditoriaService.registrar(
                    "AUTH",
                    "LOGIN_ADMIN",
                    "USUARIO",
                    null,
                    "FALLIDO",
                    "Credenciales inválidas o rol no autorizado en login administrativo",
                    null,
                    null,
                    null,
                    "{\"username\":\"" + username + "\"}"
            );

            throw new RuntimeException("Acceso denegado: Credenciales inválidas o rol no autorizado");

        } catch (Exception e) {
            auditoriaService.registrar(
                    "AUTH",
                    "LOGIN_ADMIN",
                    "USUARIO",
                    null,
                    "FALLIDO",
                    "Falló el login administrativo: " + e.getMessage(),
                    null,
                    null,
                    null,
                    "{\"username\":\"" + username + "\"}"
            );
            throw e;
        }
    }

    public Map<String, Object> loginCliente(String username, String password, String dispositivoId) {
        Usuario usuario = null;
        CuentaBancaria cuenta = null;

        try {
            usuario = usuarioRepository.findByNombreUsuario(username)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if ("BLOQUEADO".equals(usuario.getEstado())) {
                if (usuario.getFechaDesbloqueo() != null && LocalDateTime.now().isAfter(usuario.getFechaDesbloqueo())) {
                    usuario.cambiarEstado("ACTIVO");
                    usuarioRepository.save(usuario);
                } else {
                    auditoriaService.registrar(
                            "AUTH",
                            "LOGIN_CLIENTE",
                            "USUARIO",
                            usuario.getIdUsuario(),
                            "FALLIDO",
                            "Intento de login de cuenta bloqueada",
                            null,
                            null,
                            null,
                            "{\"username\":\"" + username + "\",\"dispositivoId\":\"" + dispositivoId + "\"}"
                    );
                    throw new RuntimeException("Por seguridad, tu cuenta está bloqueada. Intenta de nuevo en 24 horas.");
                }
            }

            if ("ELIMINADO".equals(usuario.getEstado()) || "INACTIVO".equals(usuario.getEstado())) {
                auditoriaService.registrar(
                        "AUTH",
                        "LOGIN_CLIENTE",
                        "USUARIO",
                        usuario.getIdUsuario(),
                        "FALLIDO",
                        "Intento de login en cuenta inactiva o eliminada",
                        null,
                        null,
                        null,
                        "{\"username\":\"" + username + "\",\"estado\":\"" + usuario.getEstado() + "\"}"
                );
                throw new RuntimeException("Esta cuenta ha sido dada de baja. Comunícate con el banco.");
            }

            if (passwordEncoder.matches(password, usuario.getContrasena()) && usuario.getRol().equals("CLIENTE")) {

                if (usuario.getIntentosFallidos() > 0) {
                    usuario.setIntentosFallidos(0);
                    usuarioRepository.save(usuario);
                }

                if (usuario.getDebeCambiarContrasena()) {
                    auditoriaService.registrar(
                            "AUTH",
                            "LOGIN_CLIENTE",
                            "USUARIO",
                            usuario.getIdUsuario(),
                            "EXITOSO",
                            "Login cliente exitoso, pero requiere cambio de contraseña",
                            null,
                            null,
                            null,
                            "{\"username\":\"" + username + "\",\"requiereCambio\":true}"
                    );

                    return Map.of(
                            "mensaje", "Debe cambiar su contraseña temporal",
                            "requiereCambio", true,
                            "idUsuario", usuario.getIdUsuario()
                    );
                }

                cuenta = cuentaRepository.findByUsuario_IdUsuario(usuario.getIdUsuario())
                        .orElseThrow(() -> new RuntimeException("El cliente no tiene cuenta asignada"));

                boolean dispositivoBloqueado = dispositivoService.estaBloqueado(dispositivoId);
                if (dispositivoBloqueado) {
                    auditoriaService.registrar(
                            "AUTH",
                            "LOGIN_CLIENTE",
                            "USUARIO",
                            usuario.getIdUsuario(),
                            "FALLIDO",
                            "Intento de login desde dispositivo bloqueado",
                            cuenta.getIdCuenta(),
                            null,
                            null,
                            "{\"username\":\"" + username + "\",\"dispositivoId\":\"" + dispositivoId + "\"}"
                    );
                    throw new RuntimeException("Este dispositivo ha sido bloqueado. Contacta con tu banco.");
                }

                if (usuario.getUltimoTokenJwt() != null && !usuario.getUltimoTokenJwt().isEmpty()) {
                    String dispositivoAnterior = usuario.getDispositivoIdentificador();
                    if (dispositivoAnterior != null && !dispositivoAnterior.equals(dispositivoId)) {
                        auditoriaService.registrar(
                                "AUTH",
                                "LOGIN_CLIENTE",
                                "USUARIO",
                                usuario.getIdUsuario(),
                                "FALLIDO",
                                "Intento de login desde otro dispositivo distinto al activo",
                                cuenta.getIdCuenta(),
                                null,
                                null,
                                "{\"username\":\"" + username + "\",\"dispositivoId\":\"" + dispositivoId + "\",\"dispositivoAnterior\":\"" + dispositivoAnterior + "\"}"
                        );
                        throw new RuntimeException("Tu cuenta está siendo usada en otro dispositivo. Solo se permite un dispositivo activo por cuenta.");
                    }
                }

                dispositivoService.registrarOActualizarDispositivo(usuario.getIdUsuario(), dispositivoId);

                UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getNombreUsuario());
                String token = jwtService.generarToken(userDetails);

                usuario.setUltimoTokenJwt(token);
                usuario.setDispositivoIdentificador(dispositivoId);
                usuario.setFechaUltimoAcceso(LocalDateTime.now());
                usuarioRepository.save(usuario);

                auditoriaService.registrar(
                        "AUTH",
                        "LOGIN_CLIENTE",
                        "USUARIO",
                        usuario.getIdUsuario(),
                        "EXITOSO",
                        "Inicio de sesión exitoso de cliente",
                        cuenta.getIdCuenta(),
                        null,
                        null,
                        "{\"username\":\"" + username + "\",\"dispositivoId\":\"" + dispositivoId + "\"}"
                );

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

                if (usuario.getIntentosFallidos() >= 3) {
                    usuario.setEstado("BLOQUEADO");
                    usuario.setFechaDesbloqueo(LocalDateTime.now().plusHours(24));
                    usuarioRepository.save(usuario);

                    auditoriaService.registrar(
                            "AUTH",
                            "LOGIN_CLIENTE",
                            "USUARIO",
                            usuario.getIdUsuario(),
                            "FALLIDO",
                            "Cuenta bloqueada por 3 intentos fallidos",
                            null,
                            null,
                            null,
                            "{\"username\":\"" + username + "\",\"intentosFallidos\":" + usuario.getIntentosFallidos() + "}"
                    );

                    throw new RuntimeException("Has fallado 3 veces. Tu cuenta ha sido bloqueada por 24 horas.");
                }

                usuarioRepository.save(usuario);

                auditoriaService.registrar(
                        "AUTH",
                        "LOGIN_CLIENTE",
                        "USUARIO",
                        usuario.getIdUsuario(),
                        "FALLIDO",
                        "Credenciales incorrectas en login cliente",
                        null,
                        null,
                        null,
                        "{\"username\":\"" + username + "\",\"intentosFallidos\":" + usuario.getIntentosFallidos() + "}"
                );

                throw new RuntimeException("Credenciales incorrectas. Intento " + usuario.getIntentosFallidos() + " de 3.");
            }

        } catch (Exception e) {
            auditoriaService.registrar(
                    "AUTH",
                    "LOGIN_CLIENTE",
                    "USUARIO",
                    usuario != null ? usuario.getIdUsuario() : null,
                    "FALLIDO",
                    "Falló el login cliente: " + e.getMessage(),
                    cuenta != null ? cuenta.getIdCuenta() : null,
                    null,
                    null,
                    "{\"username\":\"" + username + "\",\"dispositivoId\":\"" + dispositivoId + "\"}"
            );
            throw e;
        }
    }

    @Transactional
    public void cambiarPassword(Long idUsuario, String nuevaPassword) {
        try {
            Usuario usuario = usuarioRepository.findById(idUsuario)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            usuario.setContrasena(passwordEncoder.encode(nuevaPassword));
            usuario.setDebeCambiarContrasena(false);
            usuarioRepository.save(usuario);

            auditoriaService.registrar(
                    "AUTH",
                    "CAMBIAR_PASSWORD",
                    "USUARIO",
                    usuario.getIdUsuario(),
                    "EXITOSO",
                    "El usuario cambió su contraseña",
                    null,
                    null,
                    null,
                    null
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "AUTH",
                    "CAMBIAR_PASSWORD",
                    "USUARIO",
                    idUsuario,
                    "FALLIDO",
                    "Falló el cambio de contraseña: " + e.getMessage(),
                    null,
                    null,
                    null,
                    null
            );
            throw e;
        }
    }
}