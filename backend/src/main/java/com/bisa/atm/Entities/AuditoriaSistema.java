package com.bisa.atm.Entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_sistema")
@Data
public class AuditoriaSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_log")
    private Long idLog;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "modulo", nullable = false, length = 50)
    private String modulo;

    @Column(name = "accion", nullable = false, length = 50)
    private String accion;

    @Column(name = "entidad", nullable = false, length = 50)
    private String entidad;

    @Column(name = "id_entidad")
    private Long idEntidad;

    @Column(name = "resultado", nullable = false, length = 20)
    private String resultado;

    @Column(name = "descripcion", nullable = false, length = 255)
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_actor")
    private Usuario usuario;

    @Column(name = "usuario_actor", length = 100)
    private String usuarioActor;

    @Column(name = "rol_actor", length = 50)
    private String rolActor;

    @Column(name = "id_cuenta")
    private Long idCuenta;

    @Column(name = "id_cajero")
    private Long idCajero;

    @Column(name = "numero_referencia", length = 100)
    private String numeroReferencia;

    @Column(name = "ip_origen", length = 100)
    private String ipOrigen;

    @Lob
    @Column(name = "detalles_json", columnDefinition = "TEXT")
    private String detallesJson;

    public AuditoriaSistema() {
        this.fechaHora = LocalDateTime.now();
    }

    public AuditoriaSistema(
            String modulo,
            String accion,
            String entidad,
            Long idEntidad,
            String resultado,
            String descripcion,
            Usuario usuario,
            String usuarioActor,
            String rolActor,
            Long idCuenta,
            Long idCajero,
            String numeroReferencia,
            String ipOrigen,
            String detallesJson
    ) {
        this.fechaHora = LocalDateTime.now();
        this.modulo = modulo;
        this.accion = accion;
        this.entidad = entidad;
        this.idEntidad = idEntidad;
        this.resultado = resultado;
        this.descripcion = descripcion;
        this.usuario = usuario;
        this.usuarioActor = usuarioActor;
        this.rolActor = rolActor;
        this.idCuenta = idCuenta;
        this.idCajero = idCajero;
        this.numeroReferencia = numeroReferencia;
        this.ipOrigen = ipOrigen;
        this.detallesJson = detallesJson;
    }
}