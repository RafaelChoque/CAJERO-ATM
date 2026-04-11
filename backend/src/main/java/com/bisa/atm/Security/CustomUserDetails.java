package com.bisa.atm.Security;

import com.bisa.atm.Entities.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

    private final Usuario usuario;

    public CustomUserDetails(Usuario usuario) {
        this.usuario = usuario;
    }

    // Convierte el rol que guardamos en BD (ej: "CLIENTE") en una credencial oficial que Spring Security entiende
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(usuario.getRol()));
    }

    @Override
    public String getPassword() {
        return usuario.getContrasena();
    }

    @Override
    public String getUsername() {
        return usuario.getNombreUsuario();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // Verifica a nivel de seguridad global si el usuario no tiene el castigo de 3 intentos
    @Override
    public boolean isAccountNonLocked() {
        return !usuario.getEstado().equals("BLOQUEADO");
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // Filtro rápido: Si lo eliminaron lógicamente (ELIMINADO) o lo apagaron (INACTIVO), Spring le corta el paso aquí
    @Override
    public boolean isEnabled() {
        return usuario.getEstado().equals("ACTIVO");
    }

    public Long getIdUsuario() {
        return usuario.getIdUsuario();
    }
}