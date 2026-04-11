package com.bisa.atm.Services;

import com.bisa.atm.dto.ClienteDto;
import com.bisa.atm.dto.ClienteRegistroDto;
import com.bisa.atm.dto.ClienteEditarDto;
import com.bisa.atm.Entities.*;
import com.bisa.atm.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class ClienteService {
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private PersonaRepository personaRepository;
    @Autowired
    private CuentaBancariaRepository cuentaRepository;
    @Autowired
    private TarjetaVirtualRepository tarjetaRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private TransaccionRepository transaccionRepository;

    // Trae la lista de clientes para el panel, ocultando a los dados de baja
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

    // El núcleo del onboarding: Crea Persona, Usuario, Cuenta, Tarjeta y le da su saldo inicial de golpe
    @Transactional
    public void registrarNuevoCliente(ClienteRegistroDto dto) {
        Persona persona = new Persona(
                dto.getNombre(), dto.getApellidoPaterno(), dto.getApellidoMaterno(),
                dto.getCi(), dto.getFechaNacimiento(), dto.getCelular(),
                dto.getCorreoElectronico(), dto.getDireccion()
        );
        persona = personaRepository.save(persona);

        Usuario usuario = new Usuario(
                dto.getCi(), passwordEncoder.encode(dto.getCi()), "CLIENTE", persona
        );
        usuario = usuarioRepository.save(usuario);

        // Genera un número de cuenta aleatorio bancario empezando con "400"
        String numeroCuentaGen = "400" + (1000000 + new Random().nextInt(9000000));
        CuentaBancaria cuenta = new CuentaBancaria(numeroCuentaGen, dto.getSaldoInicial(), usuario);
        cuenta = cuentaRepository.save(cuenta);

        // Genera la tarjeta virtual usando los últimos 4 dígitos del carnet del cliente
        String ultimos4 = dto.getCi().length() >= 4 ? dto.getCi().substring(dto.getCi().length() - 4) : "0000";
        TarjetaVirtual tarjeta = new TarjetaVirtual(ultimos4, dto.getPinCajero(), cuenta);
        tarjetaRepository.save(tarjeta);

        // REGISTRO DEL MOVIMIENTO INICIAL (Si el administrador le puso platita al crearlo)
        if (dto.getSaldoInicial() != null && dto.getSaldoInicial().compareTo(BigDecimal.ZERO) > 0) {
            Transaccion depositoInicial = new Transaccion(
                    cuenta,
                    null, // Cajero nulo porque se hizo directo en plataforma BISA
                    dto.getSaldoInicial(),
                    "DEPÓSITO INICIAL",
                    dto.getSaldoInicial()
            );
            transaccionRepository.save(depositoInicial);
        }

        // Le avisamos al cliente por correo que ya puede entrar
        emailService.enviarCorreoBienvenida(dto.getCorreoElectronico(), dto.getCi(), dto.getCi());
    }

    // Actualiza netamente la info de contacto (Persona), no toca credenciales de seguridad (Usuario)
    @Transactional
    public void actualizarCliente(Long idUsuario, ClienteEditarDto dto) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        usuario.getPersona().actualizarDatosContacto(
                dto.getNombre(), dto.getApellidoPaterno(), dto.getApellidoMaterno(),
                dto.getCelular(), dto.getCorreoElectronico(), dto.getDireccion()
        );
        personaRepository.save(usuario.getPersona());
    }

    // Congela o descongela a un cliente manualmente desde el panel de administrador
    @Transactional
    public void cambiarEstadoCliente(Long idUsuario, String nuevoEstado) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        usuario.cambiarEstado(nuevoEstado);
        usuarioRepository.save(usuario);
    }

    // Lo "elimina" para que no pueda entrar más, pero mantiene sus transacciones históricas intactas
    @Transactional
    public void eliminarClienteLogico(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        usuario.darDeBajaLogica();
        usuarioRepository.save(usuario);
    }
}