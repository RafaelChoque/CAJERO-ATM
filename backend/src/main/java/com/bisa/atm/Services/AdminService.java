package com.bisa.atm.Services;

import com.bisa.atm.dto.CajeroDto;
import com.bisa.atm.dto.ClienteDto;
import com.bisa.atm.dto.RecargaGavetaDto;
import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.GavetaEfectivo;
import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.Repositories.GavetaEfectivoRepository;
import com.bisa.atm.Repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CajeroRepository cajeroRepository;

    @Autowired
    private GavetaEfectivoRepository gavetaEfectivoRepository;


    public List<ClienteDto> obtenerTodosLosClientes() {
        List<Usuario> usuarios = usuarioRepository.findByRol("CLIENTE");

        return usuarios.stream().map(usuario -> {
            ClienteDto dto = new ClienteDto();
            dto.setIdUsuario(usuario.getIdUsuario());
            dto.setNombreCompleto(usuario.getPersona().getNombre() + " " +
                    usuario.getPersona().getApellidoPaterno() + " " +
                    usuario.getPersona().getApellidoMaterno());
            dto.setCi(usuario.getPersona().getCi());
            dto.setCorreo(usuario.getPersona().getCorreoElectronico());
            dto.setCelular(usuario.getPersona().getCelular());
            dto.setIntentosFallidos(usuario.getIntentosFallidos());
            dto.setEstado(usuario.getEstado());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void cambiarEstadoCliente(Long idUsuario, String accion) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        if ("bloquear".equalsIgnoreCase(accion)) {
            usuario.setEstado("BLOQUEADO");
        } else if ("desbloquear".equalsIgnoreCase(accion)) {
            usuario.setEstado("ACTIVO");
            usuario.setIntentosFallidos(0);
        }

        usuarioRepository.save(usuario);
    }

    public List<CajeroDto> obtenerTodosLosCajeros() {
        List<Cajero> cajeros = cajeroRepository.findAll();

        return cajeros.stream().map(cajero -> {
            CajeroDto dto = new CajeroDto();
            dto.setIdCajero(cajero.getIdCajero());
            dto.setCodigoCajero(cajero.getCodigoCajero());
            dto.setUbicacion(cajero.getUbicacion());
            dto.setDireccionIp(cajero.getDireccionIp());
            dto.setEstado(cajero.getEstado());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void registrarCajero(CajeroDto dto) {
        Cajero nuevoCajero = new Cajero();
        nuevoCajero.setCodigoCajero(dto.getCodigoCajero());
        nuevoCajero.setUbicacion(dto.getUbicacion());
        nuevoCajero.setDireccionIp(dto.getDireccionIp());
        nuevoCajero.setEstado("ACTIVO");

        cajeroRepository.save(nuevoCajero);
    }

    @Transactional
    public void recargarGavetas(Long idCajero, List<RecargaGavetaDto> recargas) {
        Cajero cajero = cajeroRepository.findById(idCajero)
                .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));

        for (RecargaGavetaDto recarga : recargas) {
            GavetaEfectivo gaveta = gavetaEfectivoRepository
                    .findByCajero_IdCajeroAndDenominacion(idCajero, recarga.getDenominacion())
                    .orElse(new GavetaEfectivo());

            gaveta.setCajero(cajero);
            gaveta.setDenominacion(recarga.getDenominacion());
            gaveta.setCantidadActual(recarga.getCantidadActual());
            gaveta.setCapacidadMaxima(3000);

            gavetaEfectivoRepository.save(gaveta);
        }
    }

}