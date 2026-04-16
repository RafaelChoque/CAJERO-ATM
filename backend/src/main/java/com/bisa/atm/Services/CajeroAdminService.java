package com.bisa.atm.Services;

import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.dto.CajeroDto;
import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Repositories.CajeroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CajeroAdminService {

    @Autowired
    private CajeroRepository cajeroRepository;

    //devuelve a todos los cajeros activos o inactivos, pero no los eliminados
    public List<CajeroDto> obtenerTodosLosCajeros() {
        List<Cajero> cajeros = cajeroRepository.findAll();

        return cajeros.stream()
                .filter(cajero -> !"ELIMINADO".equals(cajero.getEstado()))
                .map(cajero -> {
                    CajeroDto dto = new CajeroDto();
                    dto.setIdCajero(cajero.getIdCajero());
                    dto.setCodigoCajero(cajero.getCodigoCajero());
                    dto.setUbicacion(cajero.getUbicacion());
                    dto.setDireccionIp(cajero.getDireccionIp());
                    dto.setEstado(cajero.getEstado());
                    dto.setLatitud(cajero.getLatitud());
                    dto.setLongitud(cajero.getLongitud());
                    return dto;
                }).collect(Collectors.toList());
    }

    //Recibo los datos del dto y crea un nuevo cajero en la bd
    @Transactional
    public void registrarCajero(CajeroDto dto) {
        Cajero nuevoCajero = new Cajero(
                dto.getCodigoCajero(),
                dto.getUbicacion(),
                dto.getDireccionIp(),
                dto.getLatitud(),
                dto.getLongitud()
        );
        nuevoCajero.agregarCaseta(new Caseta(10));
        nuevoCajero.agregarCaseta(new Caseta(20));
        nuevoCajero.agregarCaseta(new Caseta(50));
        nuevoCajero.agregarCaseta(new Caseta(100));
        nuevoCajero.agregarCaseta(new Caseta(200));
        cajeroRepository.save(nuevoCajero);
    }

    //busca el cajero por id si no lo encuentra lanza una excepcion y si lo encuentra actualiza sus datos
    @Transactional
    public void actualizarCajero(Long idCajero, CajeroDto dto) {
        Cajero cajero = cajeroRepository.findById(idCajero)
                .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));
        cajero.actualizarUbicacion(dto.getUbicacion(), dto.getDireccionIp(), dto.getLatitud(), dto.getLongitud());
        cajeroRepository.save(cajero);
    }

    // cambia el estado del cajero
    @Transactional
    public void cambiarEstadoCajero(Long idCajero, String nuevoEstado) {
        Cajero cajero = cajeroRepository.findById(idCajero)
                .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));
        cajero.cambiarEstado(nuevoEstado);
        cajeroRepository.save(cajero);
    }

    // borrado logico del cajero no lo borramos de la bd
    @Transactional
    public void eliminarCajeroLogico(Long idCajero) {
        Cajero cajero = cajeroRepository.findById(idCajero)
                .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));
        cajero.darDeBajaLogica();
        cajeroRepository.save(cajero);
    }
}