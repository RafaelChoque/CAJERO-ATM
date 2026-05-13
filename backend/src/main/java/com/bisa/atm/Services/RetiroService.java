package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Entities.Transaccion;
import com.bisa.atm.Repositories.CasetaRepository;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.dto.ResultadoDispensacionDto;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class RetiroService {

    private final CuentaBancariaRepository cuentaBancariaRepository;
    private final DispensacionService dispensacionService;
    private final CasetaRepository casetaRepository;
    private final TransaccionService transaccionService;
    private final AuditoriaService auditoriaService;
    private final ComprobanteRetiroService comprobanteRetiroService;

    public RetiroService(
            CuentaBancariaRepository cuentaBancariaRepository,
            DispensacionService dispensacionService,
            CasetaRepository casetaRepository,
            TransaccionService transaccionService,
            AuditoriaService auditoriaService,
            ComprobanteRetiroService comprobanteRetiroService
    ) {
        this.cuentaBancariaRepository = cuentaBancariaRepository;
        this.dispensacionService = dispensacionService;
        this.casetaRepository = casetaRepository;
        this.transaccionService = transaccionService;
        this.auditoriaService = auditoriaService;
        this.comprobanteRetiroService = comprobanteRetiroService;
    }

    @Transactional
    public byte[] confirmarRetiro(Long idCuenta, ResultadoDispensacionDto resultado) {
        Cajero cajero = null;
        BigDecimal monto = BigDecimal.ZERO;

        try {
            CuentaBancaria cuenta = cuentaBancariaRepository.findById(idCuenta)
                    .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

            monto = BigDecimal.valueOf(resultado.getMontoDispensado());

            if (monto.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Monto inválido");
            }

            if (cuenta.getSaldo().compareTo(monto) < 0) {
                dispensacionService.cancelarDispensacion(resultado);
                throw new RuntimeException("Saldo insuficiente");
            }

            cuenta.setSaldo(cuenta.getSaldo().subtract(monto));
            cuentaBancariaRepository.save(cuenta);

            dispensacionService.confirmarDispensacion(resultado);

            if (resultado.getDetalles() != null && !resultado.getDetalles().isEmpty()) {
                Long idCaseta = resultado.getDetalles().get(0).getIdCaseta();

                Caseta caseta = casetaRepository.findById(idCaseta)
                        .orElseThrow(() -> new RuntimeException("Caseta no encontrada"));

                cajero = caseta.getCajero();
            }

            Transaccion transaccion = transaccionService.registrarRetiro(
                    cuenta,
                    cajero,
                    monto,
                    cuenta.getSaldo()
            );

            auditoriaService.registrar(
                    "RETIROS",
                    "CONFIRMAR",
                    "TRANSACCION",
                    transaccion.getIdTransaccion(),
                    "EXITOSO",
                    "Se confirmó un retiro de efectivo y se generó comprobante PDF",
                    cuenta.getIdCuenta(),
                    cajero != null ? cajero.getIdCajero() : null,
                    transaccion.getNumeroReferencia(),
                    "{\"monto\": " + monto + "}"
            );

            return comprobanteRetiroService.generarPdfRetiro(
                    cuenta,
                    resultado,
                    transaccion,
                    cajero != null ? cajero.getIdCajero() : null
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "RETIROS",
                    "CONFIRMAR",
                    "TRANSACCION",
                    null,
                    "FALLIDO",
                    "Falló la confirmación del retiro: " + e.getMessage(),
                    idCuenta,
                    cajero != null ? cajero.getIdCajero() : null,
                    null,
                    "{\"monto\": " + monto + "}"
            );
            throw e;
        }
    }
}