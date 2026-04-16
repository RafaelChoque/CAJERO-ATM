package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.Billete;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BilleteRepository extends JpaRepository<Billete, Long> {
    List<Billete> findByCaseta_IdCasetaAndEstado(Long idCaseta, String estado);
    boolean existsByNumeroSerie(String numeroSerie);
    Optional<Billete> findByNumeroSerie(String numeroSerie);
    long countByCaseta_IdCasetaAndEstado(Long idCaseta, String estado);
}