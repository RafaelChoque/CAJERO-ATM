package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.Dispositivo;
import com.bisa.atm.Entities.Persona;
import com.bisa.atm.dto.DispositivoDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispositivoRepository extends JpaRepository<Dispositivo, Long> {
    Optional<Dispositivo> findByDispositivoId(String dispositivoId);
    List<Dispositivo> findByUsuario_IdUsuario(Long idUsuario);

    @Query("SELECT new com.bisa.atm.dto.DispositivoDto(" +
            "d.idDispositivo, d.dispositivoId, d.estaBloqueado, d.fechaBloqueo, " +
            "d.ultimoLogin, d.fechaRegistro, d.esActual, u.idUsuario, p.nombre, p.apellidoPaterno, " +
            "p.apellidoMaterno, p.ci) " +
            "FROM Dispositivo d " +
            "JOIN d.usuario u " +
            "JOIN u.persona p " +
            "ORDER BY d.esActual DESC, d.fechaRegistro DESC")
    List<DispositivoDto> listarTodos();
}