package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {
    List<Transaccion> findByCuenta_IdCuentaOrderByFechaHoraDesc(Long idCuenta);
}