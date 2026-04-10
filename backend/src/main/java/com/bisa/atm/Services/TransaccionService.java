package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Entities.Transaccion;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.Repositories.TransaccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TransaccionService {

    @Autowired
    private TransaccionRepository transaccionRepository;

    @Autowired
    private CuentaBancariaRepository cuentaRepository;

    // trae el historial de movimientos de la cuenta, desde el mas nuevo al mas antiguo
    public List<Transaccion> obtenerHistorial(Long idCuenta) {
        return transaccionRepository.findByCuenta_IdCuentaOrderByFechaHoraDesc(idCuenta);
    }

    // aun en desarrollo
    @Transactional
    public Transaccion registrarRetiro(CuentaBancaria cuenta, Cajero cajero, BigDecimal monto) {

        if (cuenta.getSaldo().compareTo(monto) < 0) {
            throw new RuntimeException("Saldo insuficiente para realizar el retiro");
        }
        BigDecimal nuevoSaldo = cuenta.getSaldo().subtract(monto);
        cuenta.setSaldo(nuevoSaldo);
        cuentaRepository.save(cuenta);
        Transaccion nuevaTx = new Transaccion(cuenta, cajero, monto, "RETIRO", nuevoSaldo);
        return transaccionRepository.save(nuevaTx);
    }
}