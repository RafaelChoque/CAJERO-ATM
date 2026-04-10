package com.bisa.atm.Repositories;

import com.bisa.atm.Entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
    List<Usuario> findByRol(String rol);

}