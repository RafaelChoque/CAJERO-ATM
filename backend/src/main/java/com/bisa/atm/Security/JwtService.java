package com.bisa.atm.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    // lee la contraseña que esta guardada
    @Value("${JWT_SECRET}")
    private String secretKey;

    //crea un nuevo token y le da el rol, usuario y le da tambien un tiempo valido
    public String generarToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        String rolUsuario = userDetails.getAuthorities().iterator().next().getAuthority();
        claims.put("role", rolUsuario);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 2)) // Expira en 2 horas
                .signWith(obtenerFirmaSegura(), SignatureAlgorithm.HS256)
                .compact();
    }

    // va extraer el nombre de usuario que viene encriptado en el token
    public String extraerNombreUsuario(String token) {
        return extraerClaim(token, Claims::getSubject);
    }

    // que el token sea de quien dice ser y que no haya caducado el tiempo
    public boolean esTokenValido(String token, UserDetails userDetails) {
        final String nombreUsuario = extraerNombreUsuario(token);
        return (nombreUsuario.equals(userDetails.getUsername()) && !esTokenExpirado(token));
    }

    //nomas verifica si el token expiro o nel
    private boolean esTokenExpirado(String token) {
        return extraerClaim(token, Claims::getExpiration).before(new Date());
    }

    // este metodo es el que se encarga de extraer cualquier claim del token y leerlo para validarlo
    private <T> T extraerClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(obtenerFirmaSegura())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }

    //transforma el string de la contraseña en un formato que se pueda usar para firmar el token
    private Key obtenerFirmaSegura() {
        byte[] keyBytes = secretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}