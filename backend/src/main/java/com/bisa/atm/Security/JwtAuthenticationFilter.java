package com.bisa.atm.Security;

import com.bisa.atm.Services.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    // El guardia principal: Intercepta CADA petición HTTP para revisar si trae su "gafete" (Token JWT)
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String nombreUsuario;

        // Si no trae token o no empieza con "Bearer ", lo dejamos pasar a ver si es una ruta pública (ej: /login)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Cortamos la palabra "Bearer " (7 letras) para quedarnos solo con el código encriptado
        jwt = authHeader.substring(7);
        nombreUsuario = jwtService.extraerNombreUsuario(jwt);

        // Si el token tiene dueño y ese dueño aún no ha sido registrado en esta sesión actual de Spring
        if (nombreUsuario != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(nombreUsuario);

            // Verificamos si el token es genuino y no ha caducado
            if (jwtService.esTokenValido(jwt, userDetails)) {
                // Le damos luz verde, armamos su sesión oficial y lo guardamos en el contexto de seguridad
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Continúa la cadena de peticiones hacia el controlador destino
        filterChain.doFilter(request, response);
    }
}