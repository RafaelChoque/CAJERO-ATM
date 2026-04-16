package com.bisa.atm.Services;

import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Repositories.CasetaRepository;
import com.bisa.atm.dto.CasetaDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CasetaService {

    private final CasetaRepository casetaRepository;

    public CasetaService(CasetaRepository casetaRepository) {
        this.casetaRepository = casetaRepository;
    }

    // lista las casetas activas de un cajero
    public List<CasetaDto> listarCasetasPorCajero(Long idCajero) {
        List<Caseta> casetas = casetaRepository
                .findByCajero_IdCajeroAndEstadoOrderByDenominacionDesc(idCajero, "ACTIVA");

        return casetas.stream().map(c -> {
            CasetaDto dto = new CasetaDto();
            dto.setIdCaseta(c.getIdCaseta());
            dto.setDenominacion(c.getDenominacion());
            dto.setStockActual(c.getStockActual());
            dto.setStockMinimo(c.getStockMinimo());
            dto.setCapacidadMaxima(c.getCapacidadMaxima());
            dto.setEstado(c.getEstado());
            return dto;
        }).collect(Collectors.toList());
    }
}