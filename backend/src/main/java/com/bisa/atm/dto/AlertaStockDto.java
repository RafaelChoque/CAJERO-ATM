package com.bisa.atm.dto;

import lombok.Data;

@Data
public class AlertaStockDto {
    private Long idCaseta;
    private Long idCajero;
    private Integer denominacion;
    private Integer stockActual;
    private Integer stockMinimo;
    private String tipoAlerta;
    private String mensaje;
    private Integer cantidadSugeridaEOQ;
}