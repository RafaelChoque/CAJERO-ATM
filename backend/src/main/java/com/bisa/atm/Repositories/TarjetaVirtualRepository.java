package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.TarjetaVirtual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TarjetaVirtualRepository extends JpaRepository<TarjetaVirtual, Long> {
    Optional<TarjetaVirtual> findByCuenta_IdCuenta(Long idCuenta);
}