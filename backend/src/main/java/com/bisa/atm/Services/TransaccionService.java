package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Entities.Transaccion;
import com.bisa.atm.Repositories.TransaccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TransaccionService {

    @Autowired
    private TransaccionRepository transaccionRepository;

    public List<Transaccion> obtenerHistorial(Long idCuenta) {
        return transaccionRepository.findByCuenta_IdCuentaOrderByFechaHoraDesc(idCuenta);
    }
    public Transaccion registrarRetiro(CuentaBancaria cuenta, Cajero cajero, BigDecimal monto, BigDecimal saldoResultante) {
        Transaccion nuevaTx = new Transaccion(
                cuenta,
                cajero,
                monto.negate(),
                "RETIRO",
                saldoResultante
        );
        return transaccionRepository.save(nuevaTx);
    }
    public Transaccion registrarDepositoInicial(CuentaBancaria cuenta, BigDecimal montoInicial) {
        Transaccion nuevaTx = new Transaccion(
                cuenta,
                null,
                montoInicial,
                "DEPOSITO INICIAL",
                cuenta.getSaldo()
        );
        return transaccionRepository.save(nuevaTx);
    }
}