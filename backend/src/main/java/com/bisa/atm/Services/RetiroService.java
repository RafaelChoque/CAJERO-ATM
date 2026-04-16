package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Entities.CuentaBancaria;
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

    public RetiroService(CuentaBancariaRepository cuentaBancariaRepository, DispensacionService dispensacionService, CasetaRepository casetaRepository, TransaccionService transaccionService) {
        this.cuentaBancariaRepository = cuentaBancariaRepository;
        this.dispensacionService = dispensacionService;
        this.casetaRepository = casetaRepository;
        this.transaccionService = transaccionService;
    }

    // confirma el retiro de la cuenta bancarioa una vez que los billetes fisicos fueron reservados
    @Transactional
    public void confirmarRetiro(Long idCuenta, ResultadoDispensacionDto resultado) {
        CuentaBancaria cuenta = cuentaBancariaRepository.findById(idCuenta)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        BigDecimal monto = BigDecimal.valueOf(resultado.getMontoDispensado());

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

        Cajero cajero = null;
        if (resultado.getDetalles() != null && !resultado.getDetalles().isEmpty()) {
            Long idCaseta = resultado.getDetalles().get(0).getIdCaseta();

            Caseta caseta = casetaRepository.findById(idCaseta)
                    .orElseThrow(() -> new RuntimeException("Caseta no encontrada"));

            cajero = caseta.getCajero();
        }

        transaccionService.registrarRetiro(
                cuenta,
                cajero,
                monto,
                cuenta.getSaldo()
        );
    }
}