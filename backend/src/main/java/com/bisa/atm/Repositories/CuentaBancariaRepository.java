package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.CuentaBancaria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CuentaBancariaRepository extends JpaRepository<CuentaBancaria, Long> {
    Optional<CuentaBancaria> findByUsuario_IdUsuario(Long idUsuario);
}