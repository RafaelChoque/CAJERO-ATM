package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.GavetaEfectivo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GavetaEfectivoRepository extends JpaRepository<GavetaEfectivo, Long> {
    Optional<GavetaEfectivo> findByCajero_IdCajeroAndDenominacion(Long idCajero, Integer denominacion);
}