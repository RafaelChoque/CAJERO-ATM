package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transacciones")
@Data
public class Transaccion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTransaccion;

    @Column(unique = true, nullable = false, updatable = false)
    private String numeroReferencia;

    @Column(nullable = false, length = 50)
    private String tipoTransaccion;

    @Column(nullable = false)
    private BigDecimal monto;

    private BigDecimal saldoResultante;

    @ManyToOne
    @JoinColumn(name = "id_cajero")
    private Cajero cajero;

    @ManyToOne
    @JoinColumn(name = "id_cuenta", nullable = false)
    private CuentaBancaria cuenta;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(nullable = false)
    private LocalDateTime fechaHora;

    public Transaccion() {}

    public Transaccion(CuentaBancaria cuenta, Cajero cajero, BigDecimal monto, String tipo, BigDecimal saldoPost) {
        this.numeroReferencia = generarReferenciaUnica();
        this.cuenta = cuenta;
        this.cajero = cajero;
        this.monto = monto;
        this.tipoTransaccion = tipo;
        this.saldoResultante = saldoPost;
        this.estado = "COMPLETADA";
        this.fechaHora = LocalDateTime.now();
    }

    private String generarReferenciaUnica() {
        return "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public boolean esMontoValido() {
        return this.monto != null && this.monto.compareTo(BigDecimal.ZERO) > 0;
    }
}