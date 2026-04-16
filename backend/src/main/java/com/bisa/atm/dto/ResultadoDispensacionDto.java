package com.bisa.atm.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ResultadoDispensacionDto {
    private Integer montoSolicitado;
    private Integer montoDispensado;
    private Integer restante;
    private List<DetalleDispensacionDto> detalles = new ArrayList<>();
}