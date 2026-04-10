package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tarjetas_virtuales")
@Data
public class TarjetaVirtual {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTarjeta;

    @Column(nullable = false, length = 4)
    private String ultimosCuatroDigitos;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String hashPin;

    @OneToOne
    @JoinColumn(name = "id_cuenta", nullable = false)
    private CuentaBancaria cuenta;

    private Boolean estaBloqueada;
    private Integer intentosFallidosPin;
    private String fechaExpiracion;

    public TarjetaVirtual() {}


    public TarjetaVirtual(String ultimosCuatroDigitos, String hashPin, CuentaBancaria cuenta) {
        this.ultimosCuatroDigitos = ultimosCuatroDigitos;
        this.hashPin = hashPin;
        this.cuenta = cuenta;
        this.estaBloqueada = false;
        this.intentosFallidosPin = 0;
        this.fechaExpiracion = "12/30";
    }
}