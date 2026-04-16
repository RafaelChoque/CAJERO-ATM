package com.bisa.atm.Entities;
//mejorado por rafa
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "billetes")
@Data
public class Billete {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idBillete;

    @Column(name = "numero_serie", nullable = false, length = 50)
    private String numeroSerie;

    @Column(nullable = false, length = 10)
    private String serie;

    @Column(nullable = false)
    private Integer denominacion;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_caseta", nullable = false)
    private Caseta caseta;

    public Billete() {
    }

    public Billete(String numeroSerie, String serie, Integer denominacion, Caseta caseta) {
        this.numeroSerie = numeroSerie;
        this.serie = serie;
        this.denominacion = denominacion;
        this.caseta = caseta;
        this.estado = "DISPONIBLE";
        this.fechaRegistro = LocalDateTime.now();
    }

    public void reservar() {
        if (!"DISPONIBLE".equals(this.estado)) throw new IllegalArgumentException("Billete no disponible");
        this.estado = "RESERVADO";
    }

    public void dispensar() {
        if (!"RESERVADO".equals(this.estado)) throw new IllegalArgumentException("Debe estar reservado");
        this.estado = "DISPENSADO";
    }

    public void liberarReserva() {
        if (!"RESERVADO".equals(this.estado)) throw new IllegalArgumentException("No esta reservado");
        this.estado = "DISPONIBLE";
    }

    public void invalidar() {
        this.estado = "INVALIDADO";
    }
}