package com.bisa.atm.dto;

import lombok.Data;

@Data
public class PrediccionAgotamientoDto {
    private Long idCajero;
    private String codigoCajero;
    private long totalBilletes;           // EN REALIDAD: Dinero disponible en Bs
    private double promedioBilletesXDia;  // EN REALIDAD: Promedio de Bs/día
    private long billetesRetiradosHoy;    // EN REALIDAD: Bs retirados hoy
    private int diasHastaAgotamiento;
    private String estado;
    private String alerta;
}