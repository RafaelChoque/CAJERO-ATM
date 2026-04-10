package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tokens_qr")
@Data
public class TokenQr {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idToken;

    @Column(unique = true, nullable = false, length = 100)
    private String codigoToken;

    @ManyToOne
    @JoinColumn(name = "id_cajero", nullable = false)
    private Cajero cajero;

    @ManyToOne
    @JoinColumn(name = "id_cuenta", nullable = true)
    private CuentaBancaria cuenta;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(nullable = false, length = 20)
    private String estado;

    public TokenQr() {}

    public TokenQr(Cajero cajero) {
        this.codigoToken = "QR-" + UUID.randomUUID().toString();
        this.cajero = cajero;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaExpiracion = LocalDateTime.now().plusSeconds(60);
        this.estado = "ESPERANDO_ESCANEO";
    }

    public boolean estaExpirado() {
        return LocalDateTime.now().isAfter(this.fechaExpiracion);
    }

    public void vincular(CuentaBancaria cuentaBancaria) {
        if (estaExpirado()) throw new RuntimeException("El código QR ha expirado.");
        if (!"ESPERANDO_ESCANEO".equals(this.estado)) throw new RuntimeException("Código ya procesado.");
        this.cuenta = cuentaBancaria;
        this.estado = "VINCULADO";
    }

    public void verificarYExpirar() {
        if ("ESPERANDO_ESCANEO".equals(this.estado) && estaExpirado()) {
            this.estado = "EXPIRADO";
        }
    }
}