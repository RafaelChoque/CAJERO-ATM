package com.bisa.atm.dto;

import lombok.Data;

@Data
public class CajeroDto {
    private Long idCajero;
    private String codigoCajero;
    private String ubicacion;
    private String direccionIp;
    private String estado;
    private String latitud;
    private String longitud;
}
