package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.dto.CajeroDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CajeroAdminService {

    private final CajeroRepository cajeroRepository;
    private final AuditoriaService auditoriaService;

    public CajeroAdminService(CajeroRepository cajeroRepository, AuditoriaService auditoriaService) {
        this.cajeroRepository = cajeroRepository;
        this.auditoriaService = auditoriaService;
    }

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

    @Transactional
    public void registrarCajero(CajeroDto dto) {
        try {
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

            auditoriaService.registrar(
                    "CAJEROS",
                    "CREAR",
                    "CAJERO",
                    nuevoCajero.getIdCajero(),
                    "EXITOSO",
                    "Se registró un nuevo cajero",
                    null,
                    nuevoCajero.getIdCajero(),
                    null,
                    "{\"codigoCajero\": \"" + dto.getCodigoCajero() + "\"}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "CAJEROS",
                    "CREAR",
                    "CAJERO",
                    null,
                    "FALLIDO",
                    "Falló el registro de cajero: " + e.getMessage(),
                    null,
                    null,
                    null,
                    "{\"codigoCajero\": \"" + dto.getCodigoCajero() + "\"}"
            );
            throw e;
        }
    }

    @Transactional
    public void actualizarCajero(Long idCajero, CajeroDto dto) {
        try {
            Cajero cajero = cajeroRepository.findById(idCajero)
                    .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));

            cajero.actualizarUbicacion(dto.getUbicacion(), dto.getDireccionIp(), dto.getLatitud(), dto.getLongitud());
            cajeroRepository.save(cajero);

            auditoriaService.registrar(
                    "CAJEROS",
                    "ACTUALIZAR",
                    "CAJERO",
                    cajero.getIdCajero(),
                    "EXITOSO",
                    "Se actualizó un cajero",
                    null,
                    cajero.getIdCajero(),
                    null,
                    "{\"codigoCajero\": \"" + cajero.getCodigoCajero() + "\"}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "CAJEROS",
                    "ACTUALIZAR",
                    "CAJERO",
                    idCajero,
                    "FALLIDO",
                    "Falló la actualización de cajero: " + e.getMessage(),
                    null,
                    idCajero,
                    null,
                    "{\"codigoCajero\": \"" + dto.getCodigoCajero() + "\"}"
            );
            throw e;
        }
    }

    @Transactional
    public void cambiarEstadoCajero(Long idCajero, String nuevoEstado) {
        try {
            Cajero cajero = cajeroRepository.findById(idCajero)
                    .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));

            cajero.cambiarEstado(nuevoEstado);
            cajeroRepository.save(cajero);

            auditoriaService.registrar(
                    "CAJEROS",
                    "CAMBIO_ESTADO",
                    "CAJERO",
                    cajero.getIdCajero(),
                    "EXITOSO",
                    "Se cambió el estado del cajero a " + nuevoEstado,
                    null,
                    cajero.getIdCajero(),
                    null,
                    "{\"codigoCajero\": \"" + cajero.getCodigoCajero() + "\", \"nuevoEstado\": \"" + nuevoEstado + "\"}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "CAJEROS",
                    "CAMBIO_ESTADO",
                    "CAJERO",
                    idCajero,
                    "FALLIDO",
                    "Falló el cambio de estado del cajero: " + e.getMessage(),
                    null,
                    idCajero,
                    null,
                    "{\"nuevoEstado\": \"" + nuevoEstado + "\"}"
            );
            throw e;
        }
    }

    @Transactional
    public void eliminarCajeroLogico(Long idCajero) {
        try {
            Cajero cajero = cajeroRepository.findById(idCajero)
                    .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));

            cajero.darDeBajaLogica();
            cajeroRepository.save(cajero);

            auditoriaService.registrar(
                    "CAJEROS",
                    "ELIMINAR_LOGICO",
                    "CAJERO",
                    cajero.getIdCajero(),
                    "EXITOSO",
                    "Se eliminó lógicamente un cajero",
                    null,
                    cajero.getIdCajero(),
                    null,
                    "{\"codigoCajero\": \"" + cajero.getCodigoCajero() + "\"}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "CAJEROS",
                    "ELIMINAR_LOGICO",
                    "CAJERO",
                    idCajero,
                    "FALLIDO",
                    "Falló la baja lógica del cajero: " + e.getMessage(),
                    null,
                    idCajero,
                    null,
                    null
            );
            throw e;
        }
    }
}