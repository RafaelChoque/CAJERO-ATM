package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.Caseta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CasetaRepository extends JpaRepository<Caseta, Long> {

    List<Caseta> findByCajero_IdCajeroAndEstadoOrderByDenominacionDesc(Long idCajero, String estado);

    @Query("SELECT c FROM Caseta c WHERE c.estado = 'ACTIVA' AND c.stockActual <= c.stockMinimo")
    List<Caseta> findCasetasConStockBajo();

    @Query("SELECT c FROM Caseta c WHERE c.estado = 'ACTIVA' AND c.stockActual = 0")
    List<Caseta> findCasetasSinStock();

    @Query("SELECT c FROM Caseta c WHERE c.cajero.idCajero = :idCajero AND c.estado = 'ACTIVA' AND c.stockActual <= c.stockMinimo")
    List<Caseta> findCasetasConStockBajoPorCajero(Long idCajero);
}


