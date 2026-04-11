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

    // Extrae la firma ultrasecreta desde nuestro application.properties (.env)
    @Value("${JWT_SECRET}")
    private String secretKey;

    // Fabrica un nuevo token, le estampa el Rol del usuario y le da 2 horas exactas de vida
    public String generarToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        String rolUsuario = userDetails.getAuthorities().iterator().next().getAuthority();
        claims.put("role", rolUsuario); // Guardamos el rol dentro del token para leerlo en React si hace falta

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 2)) // 2 Horas
                .signWith(obtenerFirmaSegura(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Abre el sobre del token y saca el nombre de usuario (Subject)
    public String extraerNombreUsuario(String token) {
        return extraerClaim(token, Claims::getSubject);
    }

    // Validación doble: Que el token sea de quien dice ser y que no haya caducado el tiempo
    public boolean esTokenValido(String token, UserDetails userDetails) {
        final String nombreUsuario = extraerNombreUsuario(token);
        return (nombreUsuario.equals(userDetails.getUsername()) && !esTokenExpirado(token));
    }

    // Revisa la fecha del token contra la hora actual del servidor
    private boolean esTokenExpirado(String token) {
        return extraerClaim(token, Claims::getExpiration).before(new Date());
    }

    // Motor principal: Desencripta el token usando nuestra firma secreta y devuelve el dato (Claim) que le pidamos
    private <T> T extraerClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(obtenerFirmaSegura())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }

    // Transforma nuestro string secreto en una llave matemática válida para el algoritmo HS256
    private Key obtenerFirmaSegura() {
        byte[] keyBytes = secretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}