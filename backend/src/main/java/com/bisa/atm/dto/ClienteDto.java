package com.bisa.atm.dto;

import lombok.Data;

@Data
public class ClienteDto {
    private Long idUsuario;
    private String nombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String ci;
    private String correo;
    private String celular;
    private Integer intentosFallidos;
    private String estado;
}