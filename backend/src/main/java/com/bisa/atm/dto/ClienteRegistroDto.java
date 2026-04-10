package com.bisa.atm.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ClienteRegistroDto {
    private String nombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String ci;
    private String celular;
    private String correoElectronico;
    private LocalDate fechaNacimiento;
    private String direccion;
    private BigDecimal saldoInicial;
    private String pinCajero;
}