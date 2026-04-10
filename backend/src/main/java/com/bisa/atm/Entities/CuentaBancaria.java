package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "cuentas_bancarias")
@Data
public class CuentaBancaria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idCuenta;

    @Column(unique = true, nullable = false)
    private String numeroCuenta;

    private BigDecimal saldo;

    @Column(nullable = false, length = 20)
    private String tipoCuenta;

    @Column(nullable = false, length = 3)
    private String moneda;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    public CuentaBancaria() {}

    public CuentaBancaria(String numeroCuenta, BigDecimal saldoInicial, Usuario usuario) {
        this.numeroCuenta = numeroCuenta;
        this.saldo = saldoInicial;
        this.usuario = usuario;
        this.tipoCuenta = "CAJA_AHORRO";
        this.moneda = "BOB";
    }

    public void debitarParaRetiro(BigDecimal montoRetiro) {
        if (this.saldo.compareTo(montoRetiro) < 0) {
            throw new IllegalStateException("Saldo insuficiente.");
        }
        this.saldo = this.saldo.subtract(montoRetiro);
    }
}