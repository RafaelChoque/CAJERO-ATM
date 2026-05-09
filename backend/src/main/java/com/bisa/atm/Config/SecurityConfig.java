package com.bisa.atm.Config;

import com.bisa.atm.Security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    //nomas para encriptar las contraseñas de la base de datos
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // pa que entiendan esto configura los permisos de rutas y va filtrar las peticiones JWT donde exigen el rol y token
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                        //rutas publicas (sin token)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/qr/**", "/api/tokens-qr/**").permitAll()
                        .requestMatchers("/ws-atm/**").permitAll()
                        .requestMatchers("/api/cliente/transferencias/qr/**").permitAll()

                        // Permite al tesorero ver la lista de cajeros y sus casetas (GET)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/admin/cajeros/listar").hasAnyAuthority("ADMINISTRADOR", "OPERADOR_ETV")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/admin/cajeros/*/casetas").hasAnyAuthority("ADMINISTRADOR", "OPERADOR_ETV")

                        // Permite al tesorero ver las alertas EOQ y recargar billetes físicos
                        .requestMatchers("/api/admin/casetas/**").hasAnyAuthority("ADMINISTRADOR", "OPERADOR_ETV")
                        .requestMatchers("/api/admin/alertas/**").hasAnyAuthority("ADMINISTRADOR", "OPERADOR_ETV")

                        // (Crear cajeros, editar clientes, eliminar, etc.)
                        .requestMatchers("/api/admin/**").hasAuthority("ADMINISTRADOR")
                        .requestMatchers("/api/admin/dispositivos/**").hasAuthority("ADMINISTRADOR")

                        // Otras rutas
                        .requestMatchers("/api/cajero/**").hasAnyAuthority("ADMINISTRADOR", "MANTENIMIENTO")
                        .requestMatchers("/api/cliente/**").hasAuthority("CLIENTE")

                        .anyRequest().authenticated()
                )
                //ejecuta el filtro JWT antes de que spring analice dicho usuario
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    //esto nomas valida credenciales y genera el token
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}