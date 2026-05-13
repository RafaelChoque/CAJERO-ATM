package com.bisa.atm.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class DashboardGerencialDto {

    private Long totalClientesActivos;
    private Long totalCuentas;
    private Long totalCajerosActivos;
    private Long totalCajerosMantenimiento;
    private Long totalAlertasStockBajo;

    private BigDecimal montoTotalRetiros = BigDecimal.ZERO;
    private BigDecimal montoTotalTransferenciasEnviadas = BigDecimal.ZERO;

    private List<TopCajeroDto> topCajerosUtilizados = new ArrayList<>();
    private List<TransaccionResumenDto> ultimasTransacciones = new ArrayList<>();

    @Data
    public static class TransaccionResumenDto {
        private Long idTransaccion;
        private String numeroReferencia;
        private String tipoTransaccion;
        private BigDecimal monto;
        private BigDecimal saldoResultante;
        private String estado;
        private String fechaHora;
        private Long idCuenta;
        private Long idCajero;
    }

    @Data
    public static class TopCajeroDto {
        private Long idCajero;
        private String codigoCajero;
        private Long cantidadRetiros;
        private BigDecimal montoTotalRetirado;
    }
}