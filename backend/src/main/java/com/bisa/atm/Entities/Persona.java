package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "personas")
@Data
public class Persona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPersona;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String apellidoPaterno;

    @Column(nullable = false, length = 50)
    private String apellidoMaterno;

    @Column(name = "ci", unique = true, nullable = false, length = 15)
    private String ci;

    @Column(nullable = false)
    private LocalDate fechaNacimiento;

    @Column(nullable = false, length = 20)
    private String celular;

    @Column(unique = true, nullable = false, length = 100)
    private String correoElectronico;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String direccion;

    @Column(insertable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    public Persona() {}

    public Persona(String nombre, String apellidoPaterno, String apellidoMaterno, String ci,
                   LocalDate fechaNacimiento, String celular, String correoElectronico, String direccion) {
        this.nombre = nombre;
        this.apellidoPaterno = apellidoPaterno;
        this.apellidoMaterno = apellidoMaterno;
        this.ci = ci;
        this.fechaNacimiento = fechaNacimiento;
        this.celular = celular;
        this.correoElectronico = correoElectronico;
        this.direccion = direccion;
    }

    public void actualizarDatosContacto(String nom, String pat, String mat, String cel, String correo, String dir) {
        this.nombre = nom;
        this.apellidoPaterno = pat;
        this.apellidoMaterno = mat;
        this.celular = cel;
        this.correoElectronico = correo;
        this.direccion = dir;
    }
}