package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "casetas")
@Data
public class Caseta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idCaseta;

    @Column(nullable = false)
    private Integer denominacion;

    @Column(nullable = false)
    private Integer stockActual = 0;

    @Column(nullable = false)
    private Integer stockMinimo = 0;

    @Column(nullable = false)
    private Integer capacidadMaxima = 2000;

    @Column(length = 20, nullable = false)
    private String estado = "ACTIVA";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cajero", nullable = false)
    private Cajero cajero;

    @OneToMany(mappedBy = "caseta", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<Billete> billetes = new ArrayList<>();

    public Caseta() {}

    public Caseta(Integer denominacion) {
        this.denominacion = denominacion;
        this.stockActual = 0;
        this.stockMinimo = 0;
        this.capacidadMaxima = 2000;
        this.estado = "ACTIVA";
    }

    public Caseta(Integer denominacion, Cajero cajero) {
        this.denominacion = denominacion;
        this.cajero = cajero;
        this.stockActual = 0;
        this.stockMinimo = 0;
        this.capacidadMaxima = 2000;
        this.estado = "ACTIVA";
    }

    public void actualizarPuntoReorden(int demandaDiariaPromedio, int tiempoEntregaDias) {
        this.stockMinimo = demandaDiariaPromedio * tiempoEntregaDias;
    }

    public void descontarStock(int cantidad) {
        if (cantidad <= 0) throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        if (this.stockActual < cantidad) throw new IllegalArgumentException("Stock insuficiente en la caseta");
        this.stockActual -= cantidad;
    }

    public void aumentarStock(int cantidad) {
        if (cantidad <= 0) throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
        if (this.stockActual + cantidad > this.capacidadMaxima) throw new IllegalArgumentException("Se supera la capacidad máxima");
        this.stockActual += cantidad;
    }
}