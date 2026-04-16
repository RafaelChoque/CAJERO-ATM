package com.bisa.atm.Services;

import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Repositories.CasetaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OptimizacionInventarioService {

    private final CasetaRepository casetaRepository;

    public OptimizacionInventarioService(CasetaRepository casetaRepository) {
        this.casetaRepository = casetaRepository;
    }

    // recalcular umbrales de inventario para una caseta dada su demanda anual y demanda diaria
    @Transactional
    public void recalcularUmbrales(Long idCaseta, double demandaAnualizada, double demandaDiariaPromedio) {
        Caseta caseta = casetaRepository.findById(idCaseta)
                .orElseThrow(() -> new RuntimeException("Caseta no encontrada"));

        int L = 2;

        caseta.actualizarPuntoReorden((int) Math.round(demandaDiariaPromedio), L);

        casetaRepository.save(caseta);
    }

    public int sugerirTamanioRecargaEOQ(double demandaAnualizada, double valorNominalBillete) {
        double S = 10.0;
        double h = 0.20;

        double H_dias = (valorNominalBillete * h) / 365.0;

        double eoq = Math.sqrt((2 * demandaAnualizada * S) / H_dias);
        return (int) Math.round(eoq);
    }
}