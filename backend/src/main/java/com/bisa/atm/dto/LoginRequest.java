package com.bisa.atm.dto;

import lombok.Data;

@Data
public class LoginRequest {

    private String nombreUsuario;
    private String contrasena;
    private String dispositivoId;  // Identificador único del dispositivo

}