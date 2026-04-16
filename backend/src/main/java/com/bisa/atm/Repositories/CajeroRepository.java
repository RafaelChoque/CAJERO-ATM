package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.Cajero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CajeroRepository extends JpaRepository<Cajero, Long> {
    Optional<Cajero> findByCodigoCajero(String codigoCajero);
}