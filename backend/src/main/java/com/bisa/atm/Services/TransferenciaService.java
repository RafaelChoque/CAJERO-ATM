package com.bisa.atm.Services;

import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Entities.Transaccion;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.Repositories.TransaccionRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class TransferenciaService {

    private final CuentaBancariaRepository cuentaBancariaRepository;
    private final TransaccionRepository transaccionRepository;
    private final AuditoriaService auditoriaService;

    public TransferenciaService(
            CuentaBancariaRepository cuentaBancariaRepository,
            TransaccionRepository transaccionRepository,
            AuditoriaService auditoriaService
    ) {
        this.cuentaBancariaRepository = cuentaBancariaRepository;
        this.transaccionRepository = transaccionRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public void transferir(Long idCuentaOrigen, String numeroCuentaDestino, BigDecimal monto) {
        try {
            CuentaBancaria cuentaOrigen = cuentaBancariaRepository.findById(idCuentaOrigen)
                    .orElseThrow(() -> new RuntimeException("Cuenta origen no encontrada"));

            CuentaBancaria cuentaDestino = cuentaBancariaRepository.findByNumeroCuenta(numeroCuentaDestino)
                    .orElseThrow(() -> new RuntimeException("Cuenta destino no encontrada"));

            if (cuentaOrigen.getIdCuenta().equals(cuentaDestino.getIdCuenta())) {
                throw new RuntimeException("No puedes transferir a la misma cuenta");
            }

            if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("El monto debe ser mayor a cero");
            }

            if (cuentaOrigen.getSaldo().compareTo(monto) < 0) {
                throw new RuntimeException("Saldo insuficiente");
            }

            cuentaOrigen.setSaldo(cuentaOrigen.getSaldo().subtract(monto));
            cuentaDestino.setSaldo(cuentaDestino.getSaldo().add(monto));

            cuentaBancariaRepository.save(cuentaOrigen);
            cuentaBancariaRepository.save(cuentaDestino);

            Transaccion txSalida = new Transaccion(
                    cuentaOrigen,
                    null,
                    monto.negate(),
                    "TRANSFERENCIA ENVIADA",
                    cuentaOrigen.getSaldo()
            );

            Transaccion txEntrada = new Transaccion(
                    cuentaDestino,
                    null,
                    monto,
                    "TRANSFERENCIA RECIBIDA",
                    cuentaDestino.getSaldo()
            );

            transaccionRepository.save(txSalida);
            transaccionRepository.save(txEntrada);

            auditoriaService.registrar(
                    "TRANSFERENCIAS",
                    "REALIZAR",
                    "TRANSACCION",
                    null,
                    "EXITOSO",
                    "Se realizó una transferencia entre cuentas",
                    cuentaOrigen.getIdCuenta(),
                    null,
                    txSalida.getNumeroReferencia(),
                    "{\"monto\": " + monto + ", \"cuentaDestino\": \"" + numeroCuentaDestino + "\"}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "TRANSFERENCIAS",
                    "REALIZAR",
                    "TRANSACCION",
                    null,
                    "FALLIDO",
                    "Falló la transferencia: " + e.getMessage(),
                    idCuentaOrigen,
                    null,
                    null,
                    "{\"monto\": " + monto + ", \"cuentaDestino\": \"" + numeroCuentaDestino + "\"}"
            );
            throw e;
        }
    }
}