package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "gavetas_efectivo")
@Data
public class GavetaEfectivo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idGaveta;

    @ManyToOne
    @JoinColumn(name = "id_cajero", nullable = false)
    private Cajero cajero;

    private Integer denominacion;
    private Integer cantidadActual;
    private Integer capacidadMaxima = 2000;
}