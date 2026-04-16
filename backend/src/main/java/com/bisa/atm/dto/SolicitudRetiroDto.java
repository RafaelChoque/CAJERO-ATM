package com.bisa.atm.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SolicitudRetiroDto {
    private Long idCuenta;
    private Long idCajero;
    private BigDecimal monto;
}