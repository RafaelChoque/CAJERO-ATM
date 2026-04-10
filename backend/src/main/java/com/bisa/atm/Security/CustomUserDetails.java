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

    //convierte el rol del usuario en un permiso que spring pueda entender
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

    // verifica si el usuario no esta bloqueado en la bd
    @Override
    public boolean isAccountNonLocked() {
        return !usuario.getEstado().equals("BLOQUEADO");
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // verifica si el usuario esta actibo en la bd xd
    @Override
    public boolean isEnabled() {
        return usuario.getEstado().equals("ACTIVO");
    }

    public Long getIdUsuario() {
        return usuario.getIdUsuario();
    }
}