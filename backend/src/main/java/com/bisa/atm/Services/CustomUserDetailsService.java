package com.bisa.atm.Services;

import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.UsuarioRepository;
import com.bisa.atm.Security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // este metodo es llamado por spring security para cargar los detalles del usuario durante el proceso de autenticación
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado en la red: " + username));

        return new CustomUserDetails(usuario);
    }
}