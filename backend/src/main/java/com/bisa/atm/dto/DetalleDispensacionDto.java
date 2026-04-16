package com.bisa.atm.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DetalleDispensacionDto {
    private Integer denominacion;
    private Integer cantidad;
    private Long idCaseta;
    private List<String> numerosSerie = new ArrayList<>();
}