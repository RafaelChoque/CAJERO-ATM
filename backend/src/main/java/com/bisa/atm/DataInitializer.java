package com.bisa.atm;

import com.bisa.atm.Entities.Persona;
import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.PersonaRepository; // Asegúrate de que se llame así
import com.bisa.atm.Repositories.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository ur, PasswordEncoder pe, PersonaRepository pr) {
        this.usuarioRepository = ur;
        this.passwordEncoder = pe;
        this.personaRepository = pr;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            Persona adminPersona = new Persona();
            adminPersona.setNombre("Admin");
            adminPersona.setApellidoPaterno("Bisa");
            adminPersona.setApellidoMaterno("General");
            adminPersona.setCi("1234567");
            adminPersona.setCelular("70000000");
            adminPersona.setCorreoElectronico("admin@bisa.com.bo");
            adminPersona.setDireccion("Oficina Central La Paz");
            adminPersona.setFechaNacimiento(LocalDate.of(1990, 1, 1));

            personaRepository.save(adminPersona);

            Usuario admin = new Usuario();
            admin.setNombreUsuario("admin_bisa");
            admin.setContrasena(passwordEncoder.encode("bisa2026"));
            admin.setRol("ADMINISTRADOR");
            admin.setPersona(adminPersona);
            admin.setEstado("ACTIVO");
            admin.setDebeCambiarContrasena(false);

            usuarioRepository.save(admin);

        }
    }
}