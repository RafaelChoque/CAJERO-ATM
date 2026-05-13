package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.Transaccion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    List<Transaccion> findByCuenta_IdCuentaOrderByFechaHoraDesc(Long idCuenta);

    List<Transaccion> findTop10ByOrderByFechaHoraDesc();
    long countByCajeroAndFechaHoraAfter(Cajero cajero, LocalDateTime fecha);

    @Query("SELECT COALESCE(SUM(t.monto), 0) FROM Transaccion t WHERE t.tipoTransaccion = :tipo")
    BigDecimal sumMontoByTipoTransaccion(@Param("tipo") String tipo);

    @Query("""
        SELECT
            t.cajero.idCajero,
            t.cajero.codigoCajero,
            COUNT(t),
            COALESCE(SUM(ABS(t.monto)), 0)
        FROM Transaccion t
        WHERE t.tipoTransaccion = 'RETIRO'
          AND t.estado = 'COMPLETADA'
          AND t.cajero IS NOT NULL
          AND t.fechaHora >= :fechaInicio
        GROUP BY t.cajero.idCajero, t.cajero.codigoCajero
        ORDER BY COUNT(t) DESC
    """)
    List<Object[]> findTop3CajerosMasUtilizadosUltimos30Dias(
            @Param("fechaInicio") LocalDateTime fechaInicio,
            Pageable pageable
    );
    // Suma el monto total retirado en un periodo
    @Query("SELECT COALESCE(SUM(ABS(t.monto)), 0) FROM Transaccion t " +
            "WHERE t.cajero = :cajero AND t.fechaHora >= :fecha AND t.tipoTransaccion = 'RETIRO'")
    BigDecimal sumMontoRetiradoByCajeroAndFechaHoraAfter(@Param("cajero") Cajero cajero, @Param("fecha") LocalDateTime fecha);
}