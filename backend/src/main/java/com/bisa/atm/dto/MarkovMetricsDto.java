package com.bisa.atm.dto;

import lombok.Data;

@Data
public class MarkovMetricsDto {
    private Long idCajero;
    private String codigoCajero;
    private String estadoActual;

    // Probabilidades a largo plazo (Estado Estable)
    private double probOptimo;
    private double probRiesgo;
    private double probMantenimiento;

    private String recomendacionPredictiva;
}