package com.bisa.atm.dto;

import lombok.Data;

@Data
public class QueueMetricsDto {
    private Long idCajero;
    private String codigoCajero;
    private double lambda; // Tasa de llegadas (clientes por hora)
    private double mu;     // Tasa de servicio promedio (clientes que PUEDE atender por hora)
    private double rho;    // Utilización del sistema (%)
    private double lq;     // Número promedio de personas en la cola
    private double wq;     // Tiempo promedio de espera en la cola (en minutos)
    private String alerta; // Mensaje gerencial
}