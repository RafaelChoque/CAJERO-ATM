package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispositivos")
@Data
public class Dispositivo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDispositivo;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(unique = true, nullable = false, length = 255)
    private String dispositivoId;

    @Column(nullable = false)
    private Boolean estaBloqueado = false;

    @Column(nullable = true)
    private LocalDateTime fechaBloqueo;

    @Column(nullable = true)
    private LocalDateTime ultimoLogin;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean esActual = false;

    public Dispositivo() {}

    public Dispositivo(Usuario usuario, String dispositivoId) {
        this.usuario = usuario;
        this.dispositivoId = dispositivoId;
        this.estaBloqueado = false;
        this.fechaRegistro = LocalDateTime.now();
        this.esActual = false;
    }
}