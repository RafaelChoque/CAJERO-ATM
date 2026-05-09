package com.bisa.atm;

import com.bisa.atm.Entities.Persona;
import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.PersonaRepository;
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

            Persona etvPersona = new Persona();
            etvPersona.setNombre("Logística");
            etvPersona.setApellidoPaterno("Prosegur");
            etvPersona.setApellidoMaterno("Bolivia");
            etvPersona.setCi("9876543");
            etvPersona.setCelular("71111111");
            etvPersona.setCorreoElectronico("operaciones@prosegur.com.bo");
            etvPersona.setDireccion("Base Operaciones ETV");
            etvPersona.setFechaNacimiento(LocalDate.of(1985, 5, 15));
            personaRepository.save(etvPersona);

            Usuario operadorEtv = new Usuario();
            operadorEtv.setNombreUsuario("etv_bisa");
            operadorEtv.setContrasena(passwordEncoder.encode("prosegur2026"));
            operadorEtv.setRol("OPERADOR_ETV");
            operadorEtv.setPersona(etvPersona);
            operadorEtv.setEstado("ACTIVO");
            operadorEtv.setDebeCambiarContrasena(false);
            usuarioRepository.save(operadorEtv);

        }
    }
}