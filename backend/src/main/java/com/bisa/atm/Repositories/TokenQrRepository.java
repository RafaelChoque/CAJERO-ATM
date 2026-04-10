package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.TokenQr;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TokenQrRepository extends JpaRepository<TokenQr, Long> {
    Optional<TokenQr> findByCodigoToken(String codigoToken);
}