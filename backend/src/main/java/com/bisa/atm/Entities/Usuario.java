package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuario;

    @Column(unique = true, nullable = false, length = 50)
    private String nombreUsuario;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contrasena;

    @Column(nullable = false, length = 20)
    private String rol;

    @OneToOne
    @JoinColumn(name = "id_persona", nullable = false)
    private Persona persona;

    private Integer intentosFallidos;
    private Boolean debeCambiarContrasena;
    private String estado;
    private LocalDateTime fechaDesbloqueo;

    public Usuario() {}

    public Usuario(String nombreUsuario, String contrasena, String rol, Persona persona) {
        this.nombreUsuario = nombreUsuario;
        this.contrasena = contrasena;
        this.rol = rol;
        this.persona = persona;
        this.intentosFallidos = 0;
        this.debeCambiarContrasena = true;
        this.estado = "ACTIVO";
    }

    public void cambiarEstado(String nuevoEstado) {
        if (nuevoEstado.equals("ACTIVO") || nuevoEstado.equals("BLOQUEADO") || nuevoEstado.equals("INACTIVO")) {
            this.estado = nuevoEstado;

            if (nuevoEstado.equals("ACTIVO")) {
                this.intentosFallidos = 0;
                this.fechaDesbloqueo = null;
            }
        } else {
            throw new IllegalArgumentException("Estado no válido para el usuario");
        }
    }

    public void darDeBajaLogica() {
        this.estado = "ELIMINADO";
    }
}