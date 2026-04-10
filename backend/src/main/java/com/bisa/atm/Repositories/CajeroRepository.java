package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.Cajero;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CajeroRepository extends JpaRepository<Cajero, Long> {
}