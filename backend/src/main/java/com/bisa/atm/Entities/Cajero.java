package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cajeros")
@Data
public class Cajero {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idCajero;

    @Column(unique = true, nullable = false, length = 20)
    private String codigoCajero;

    @Column(length = 20)
    private String estado;

    @Column(nullable = false)
    private String ubicacion;

    @Column(unique = true, length = 45)
    private String direccionIp;

    @Column(length = 50)
    private String latitud;

    @Column(length = 50)
    private String longitud;

    @OneToMany(mappedBy = "cajero", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<Caseta> casetas = new ArrayList<>();

    public Cajero() {

    }

    public Cajero(String codigoCajero, String ubicacion, String direccionIp, String latitud, String longitud) {
        this.codigoCajero = codigoCajero;
        this.ubicacion = ubicacion;
        this.direccionIp = direccionIp;
        this.latitud = latitud;
        this.longitud = longitud;
        this.estado = "ACTIVO";
    }

    public void actualizarUbicacion(String nuevaUbicacion, String ip, String lat, String lng) {
        this.ubicacion = nuevaUbicacion;
        this.direccionIp = ip;
        this.latitud = lat;
        this.longitud = lng;
    }

    public void cambiarEstado(String nuevoEstado) {
        if (nuevoEstado.equals("ACTIVO") || nuevoEstado.equals("MANTENIMIENTO")) {
            this.estado = nuevoEstado;
        } else {
            throw new IllegalArgumentException("Estado no válido para el cajero");
        }
    }

    public void darDeBajaLogica() {
        this.estado = "ELIMINADO";
    }

    public void agregarCaseta(Caseta caseta) {
        casetas.add(caseta);
        caseta.setCajero(this);
    }
}