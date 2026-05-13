package com.bisa.atm.Controllers;

import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.Services.DispensacionService;
import com.bisa.atm.Services.RetiroService;
import com.bisa.atm.dto.ResultadoDispensacionDto;
import com.bisa.atm.dto.SolicitudRetiroDto;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/qr/retiros")
@CrossOrigin(origins = "*")
public class RetiroQrController {

    private final DispensacionService dispensacionService;
    private final RetiroService retiroService;
    private final CuentaBancariaRepository cuentaBancariaRepository;

    public RetiroQrController(
            DispensacionService dispensacionService,
            RetiroService retiroService,
            CuentaBancariaRepository cuentaBancariaRepository
    ) {
        this.dispensacionService = dispensacionService;
        this.retiroService = retiroService;
        this.cuentaBancariaRepository = cuentaBancariaRepository;
    }

    @PostMapping("/reservar")
    public ResponseEntity<?> reservar(@RequestBody SolicitudRetiroDto request) {
        try {
            CuentaBancaria cuenta = cuentaBancariaRepository.findById(request.getIdCuenta())
                    .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

            if (cuenta.getSaldo().compareTo(request.getMonto()) < 0) {
                throw new RuntimeException("Saldo insuficiente");
            }

            ResultadoDispensacionDto resultado =
                    dispensacionService.reservarBilletes(request.getIdCajero(), request.getMonto());

            return ResponseEntity.ok(resultado);

        } catch (ResponseStatusException e) {
            return ResponseEntity
                    .status(e.getStatusCode())
                    .body(Map.of("message", e.getReason()));

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/confirmar")
    public ResponseEntity<?> confirmar(
            @RequestParam Long idCuenta,
            @RequestBody ResultadoDispensacionDto resultado
    ) {
        try {
            byte[] pdf = retiroService.confirmarRetiro(idCuenta, resultado);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=comprobante-retiro.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/cancelar")
    public ResponseEntity<?> cancelar(@RequestBody ResultadoDispensacionDto resultado) {
        try {
            dispensacionService.cancelarDispensacion(resultado);
            return ResponseEntity.ok(Map.of("message", "Retiro cancelado"));

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}