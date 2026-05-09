package com.bisa.atm.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransferenciaQrDto {
    private Long idCuentaOrigen;
    private Long idCuentaDestino;
    private BigDecimal monto;
    private String tokenQr;
}