package com.bisa.atm.dto;

import lombok.Data;

@Data
public class CasetaDto {
    private Long idCaseta;
    private Integer denominacion;
    private Integer stockActual;
    private Integer stockMinimo;
    private Integer capacidadMaxima;
    private String estado;
}