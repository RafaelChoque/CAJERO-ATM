package com.bisa.atm.dto;

import lombok.Data;

@Data
public class TokenQrRequest {
    private String codigoToken;
    private Long idCuenta;
}