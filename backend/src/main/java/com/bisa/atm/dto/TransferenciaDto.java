package com.bisa.atm.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferenciaDto {
    private Long idCuentaOrigen;
    private String numeroCuentaDestino;
    private BigDecimal monto;
}