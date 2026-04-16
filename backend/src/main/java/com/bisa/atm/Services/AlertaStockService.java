package com.bisa.atm.Services;

import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Repositories.BilleteRepository; // 🚀 Importación necesaria
import com.bisa.atm.Repositories.CasetaRepository;
import com.bisa.atm.dto.AlertaStockDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertaStockService {

    private final CasetaRepository casetaRepository;
    private final OptimizacionInventarioService optimizacionService;
    private final BilleteRepository billeteRepository;

    //inyectar el repositorio de billetes para acceder al historial de retiros
    public AlertaStockService(CasetaRepository casetaRepository, OptimizacionInventarioService optimizacionService, BilleteRepository billeteRepository) {
        this.casetaRepository = casetaRepository;
        this.optimizacionService = optimizacionService;
        this.billeteRepository = billeteRepository;
    }

    //obtiene las alertas de stock para todas las casetas que estén por debajo del umbral, sin importar el cajero
    public List<AlertaStockDto> obtenerAlertasStock() {
        List<Caseta> casetas = casetaRepository.findCasetasConStockBajo();
        return casetas.stream().map(this::mapearAlerta).toList();
    }

    //obtiene las alertas de stock para las casetas de un cajero especifico
    public List<AlertaStockDto> obtenerAlertasStockPorCajero(Long idCajero) {
        List<Caseta> casetas = casetaRepository.findCasetasConStockBajoPorCajero(idCajero);
        return casetas.stream().map(this::mapearAlerta).toList();
    }

    // mapea la informacion de la caseta a un dto de alerta
    private AlertaStockDto mapearAlerta(Caseta caseta) {
        AlertaStockDto dto = new AlertaStockDto();
        dto.setIdCaseta(caseta.getIdCaseta());
        dto.setIdCajero(caseta.getCajero().getIdCajero());
        dto.setDenominacion(caseta.getDenominacion());
        dto.setStockActual(caseta.getStockActual());
        dto.setStockMinimo(caseta.getStockMinimo());

        if (caseta.getStockActual() == 0) {
            dto.setTipoAlerta("SIN_STOCK");
            dto.setMensaje("La caseta se quedó sin billetes. Urge recarga.");
        } else {
            dto.setTipoAlerta("STOCK_BAJO");
            dto.setMensaje("La caseta alcanzó su Punto de Reorden.");
        }

        // implementacion modelo eoq para sugerir cantidad de recarga basada en demanda anual
        long billetesDispensados = billeteRepository.countByCaseta_IdCasetaAndEstado(caseta.getIdCaseta(), "DISPENSADO");
        int diasOperacionSimulados = 30;
        double demandaDiariaReal = (double) billetesDispensados / diasOperacionSimulados;
        double demandaAnualizada = demandaDiariaReal * 365.0;

        if (demandaAnualizada == 0) {
            demandaAnualizada = 15000.0;
        }

        int eoq = optimizacionService.sugerirTamanioRecargaEOQ(demandaAnualizada, caseta.getDenominacion());
        dto.setCantidadSugeridaEOQ(eoq);
        return dto;
    }
}