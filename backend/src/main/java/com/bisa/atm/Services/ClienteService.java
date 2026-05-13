package com.bisa.atm.Services;

import com.bisa.atm.dto.ClienteDto;
import com.bisa.atm.dto.ClienteRegistroDto;
import com.bisa.atm.dto.ClienteEditarDto;
import com.bisa.atm.Entities.*;
import com.bisa.atm.Repositories.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final CuentaBancariaRepository cuentaRepository;
    private final TarjetaVirtualRepository tarjetaRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final TransaccionRepository transaccionRepository;
    private final AuditoriaService auditoriaService;

    public ClienteService(
            UsuarioRepository usuarioRepository,
            PersonaRepository personaRepository,
            CuentaBancariaRepository cuentaRepository,
            TarjetaVirtualRepository tarjetaRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            TransaccionRepository transaccionRepository,
            AuditoriaService auditoriaService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.personaRepository = personaRepository;
        this.cuentaRepository = cuentaRepository;
        this.tarjetaRepository = tarjetaRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.transaccionRepository = transaccionRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<ClienteDto> obtenerTodosLosClientes() {
        List<Usuario> usuarios = usuarioRepository.findByRol("CLIENTE");

        return usuarios.stream()
                .filter(usuario -> !"ELIMINADO".equals(usuario.getEstado()))
                .map(usuario -> {
                    ClienteDto dto = new ClienteDto();
                    dto.setIdUsuario(usuario.getIdUsuario());
                    dto.setNombre(usuario.getPersona().getNombre());
                    dto.setApellidoPaterno(usuario.getPersona().getApellidoPaterno());
                    dto.setApellidoMaterno(usuario.getPersona().getApellidoMaterno());
                    dto.setCi(usuario.getPersona().getCi());
                    dto.setCorreo(usuario.getPersona().getCorreoElectronico());
                    dto.setCelular(usuario.getPersona().getCelular());
                    dto.setIntentosFallidos(usuario.getIntentosFallidos());
                    dto.setEstado(usuario.getEstado());
                    return dto;
                }).collect(Collectors.toList());
    }

    @Transactional
    public void registrarNuevoCliente(ClienteRegistroDto dto) {
        CuentaBancaria cuenta = null;
        Usuario usuario = null;

        try {
            Persona persona = new Persona(
                    dto.getNombre(), dto.getApellidoPaterno(), dto.getApellidoMaterno(),
                    dto.getCi(), dto.getFechaNacimiento(), dto.getCelular(),
                    dto.getCorreoElectronico(), dto.getDireccion()
            );
            persona = personaRepository.save(persona);

            usuario = new Usuario(
                    dto.getCi(), passwordEncoder.encode(dto.getCi()), "CLIENTE", persona
            );
            usuario = usuarioRepository.save(usuario);

            String numeroCuentaGen = "400" + (1000000 + new Random().nextInt(9000000));
            cuenta = new CuentaBancaria(numeroCuentaGen, dto.getSaldoInicial(), usuario);
            cuenta = cuentaRepository.save(cuenta);

            String ultimos4 = dto.getCi().length() >= 4 ? dto.getCi().substring(dto.getCi().length() - 4) : "0000";
            TarjetaVirtual tarjeta = new TarjetaVirtual(ultimos4, dto.getPinCajero(), cuenta);
            tarjetaRepository.save(tarjeta);

            if (dto.getSaldoInicial() != null && dto.getSaldoInicial().compareTo(BigDecimal.ZERO) > 0) {
                Transaccion depositoInicial = new Transaccion(
                        cuenta,
                        null,
                        dto.getSaldoInicial(),
                        "DEPÓSITO INICIAL",
                        dto.getSaldoInicial()
                );
                transaccionRepository.save(depositoInicial);
            }

            emailService.enviarCorreoBienvenida(dto.getCorreoElectronico(), dto.getCi(), dto.getCi());

            auditoriaService.registrar(
                    "CLIENTES",
                    "CREAR",
                    "CLIENTE",
                    usuario.getIdUsuario(),
                    "EXITOSO",
                    "Se registró un nuevo cliente con cuenta bancaria",
                    cuenta.getIdCuenta(),
                    null,
                    null,
                    "{\"ci\":\"" + dto.getCi() + "\",\"numeroCuenta\":\"" + cuenta.getNumeroCuenta() + "\"}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "CLIENTES",
                    "CREAR",
                    "CLIENTE",
                    usuario != null ? usuario.getIdUsuario() : null,
                    "FALLIDO",
                    "Falló el registro de cliente: " + e.getMessage(),
                    cuenta != null ? cuenta.getIdCuenta() : null,
                    null,
                    null,
                    "{\"ci\":\"" + dto.getCi() + "\"}"
            );
            throw e;
        }
    }

    @Transactional
    public void actualizarCliente(Long idUsuario, ClienteEditarDto dto) {
        try {
            Usuario usuario = usuarioRepository.findById(idUsuario)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            usuario.getPersona().actualizarDatosContacto(
                    dto.getNombre(), dto.getApellidoPaterno(), dto.getApellidoMaterno(),
                    dto.getCelular(), dto.getCorreoElectronico(), dto.getDireccion()
            );
            personaRepository.save(usuario.getPersona());

            auditoriaService.registrar(
                    "CLIENTES",
                    "ACTUALIZAR",
                    "CLIENTE",
                    usuario.getIdUsuario(),
                    "EXITOSO",
                    "Se actualizó la información de un cliente",
                    null,
                    null,
                    null,
                    "{\"correo\":\"" + dto.getCorreoElectronico() + "\"}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "CLIENTES",
                    "ACTUALIZAR",
                    "CLIENTE",
                    idUsuario,
                    "FALLIDO",
                    "Falló la actualización del cliente: " + e.getMessage(),
                    null,
                    null,
                    null,
                    null
            );
            throw e;
        }
    }

    @Transactional
    public void cambiarEstadoCliente(Long idUsuario, String nuevoEstado) {
        try {
            Usuario usuario = usuarioRepository.findById(idUsuario)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            usuario.cambiarEstado(nuevoEstado);
            usuarioRepository.save(usuario);

            auditoriaService.registrar(
                    "CLIENTES",
                    "CAMBIO_ESTADO",
                    "CLIENTE",
                    usuario.getIdUsuario(),
                    "EXITOSO",
                    "Se cambió el estado del cliente a " + nuevoEstado,
                    null,
                    null,
                    null,
                    "{\"nuevoEstado\":\"" + nuevoEstado + "\"}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "CLIENTES",
                    "CAMBIO_ESTADO",
                    "CLIENTE",
                    idUsuario,
                    "FALLIDO",
                    "Falló el cambio de estado del cliente: " + e.getMessage(),
                    null,
                    null,
                    null,
                    "{\"nuevoEstado\":\"" + nuevoEstado + "\"}"
            );
            throw e;
        }
    }

    @Transactional
    public void eliminarClienteLogico(Long idUsuario) {
        try {
            Usuario usuario = usuarioRepository.findById(idUsuario)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            usuario.darDeBajaLogica();
            usuarioRepository.save(usuario);

            auditoriaService.registrar(
                    "CLIENTES",
                    "ELIMINAR_LOGICO",
                    "CLIENTE",
                    usuario.getIdUsuario(),
                    "EXITOSO",
                    "Se eliminó lógicamente un cliente",
                    null,
                    null,
                    null,
                    null
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "CLIENTES",
                    "ELIMINAR_LOGICO",
                    "CLIENTE",
                    idUsuario,
                    "FALLIDO",
                    "Falló la baja lógica del cliente: " + e.getMessage(),
                    null,
                    null,
                    null,
                    null
            );
            throw e;
        }
    }
}