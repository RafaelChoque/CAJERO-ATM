package com.bisa.atm.dto;

import lombok.Data;
@Data

public class ClienteEditarDto {
    private String nombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String celular;
    private String correoElectronico;
    private String direccion;
}
