package com.bisa.atm.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DispositivoDto {
    private Long idDispositivo;
    private String dispositivoId;
    private Boolean estaBloqueado;
    private LocalDateTime fechaBloqueo;
    private LocalDateTime ultimoLogin;
    private LocalDateTime fechaRegistro;
    private Boolean esActual;

    private Long idUsuario;
    private String nombreUsuario;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String ci;

    // Constructor
    public DispositivoDto(Long idDispositivo, String dispositivoId, Boolean estaBloqueado,
                          LocalDateTime fechaBloqueo, LocalDateTime ultimoLogin, LocalDateTime fechaRegistro,
                          Boolean esActual, Long idUsuario, String nombreUsuario, String apellidoPaterno,
                          String apellidoMaterno, String ci) {
        this.idDispositivo = idDispositivo;
        this.dispositivoId = dispositivoId;
        this.estaBloqueado = estaBloqueado;
        this.fechaBloqueo = fechaBloqueo;
        this.ultimoLogin = ultimoLogin;
        this.fechaRegistro = fechaRegistro;
        this.esActual = esActual;
        this.idUsuario = idUsuario;
        this.nombreUsuario = nombreUsuario;
        this.apellidoPaterno = apellidoPaterno;
        this.apellidoMaterno = apellidoMaterno;
        this.ci = ci;
    }
}