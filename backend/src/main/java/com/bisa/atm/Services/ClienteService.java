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

    // devuelve a todos los clientes activos o inactivos,
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

    //Recibo los datos del dto y crea un nuevo cliente ademas de crear su cuenta bancaria, tarjeta virtual y registrar el movimiento inicial
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

        //genera un numero de cuenta aleatorio bancario empezando con 400
        String numeroCuentaGen = "400" + (1000000 + new Random().nextInt(9000000));
        CuentaBancaria cuenta = new CuentaBancaria(numeroCuentaGen, dto.getSaldoInicial(), usuario);
        cuenta = cuentaRepository.save(cuenta);

        //genera la tarjeta virtual  usando los 4 ultimos digitos del carnet del cliente
        String ultimos4 = dto.getCi().length() >= 4 ? dto.getCi().substring(dto.getCi().length() - 4) : "0000";
        TarjetaVirtual tarjeta = new TarjetaVirtual(ultimos4, dto.getPinCajero(), cuenta);
        tarjetaRepository.save(tarjeta);

        // registro del movimiento inicial
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
    }

    //busca al cliente por su id si no lo encuentra lanza una excepcion y si lo encuentra actualiza sus datos de contacto
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

    // cambia el estado del cliente dependiendo de la accion del admin
    @Transactional
    public void cambiarEstadoCliente(Long idUsuario, String nuevoEstado) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        usuario.cambiarEstado(nuevoEstado);
        usuarioRepository.save(usuario);
    }

    // borrado logico del cliente no lo borramos de la bd
    @Transactional
    public void eliminarClienteLogico(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        usuario.darDeBajaLogica();
        usuarioRepository.save(usuario);
    }
}