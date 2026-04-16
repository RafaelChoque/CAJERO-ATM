package com.bisa.atm.Controllers;

import com.bisa.atm.Services.DispensacionService;
import com.bisa.atm.Services.RetiroService;
import com.bisa.atm.dto.ResultadoDispensacionDto;
import com.bisa.atm.dto.SolicitudRetiroDto;
import org.springframework.http.HttpStatus;
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

    //inyeccion de dependencias de retiro qr
    public RetiroQrController(DispensacionService dispensacionService,
                              RetiroService retiroService) {
        this.dispensacionService = dispensacionService;
        this.retiroService = retiroService;
    }

    // para reservar billetes para retiro qr
    @PostMapping("/reservar")
    public ResponseEntity<?> reservar(@RequestBody SolicitudRetiroDto request) {
        try {
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

    // para confirmar el retiro qr y descontar el monto de la cuenta
    @PostMapping("/confirmar")
    public ResponseEntity<?> confirmar(
            @RequestParam Long idCuenta,
            @RequestBody ResultadoDispensacionDto resultado
    ) {
        try {
            retiroService.confirmarRetiro(idCuenta, resultado);
            return ResponseEntity.ok(Map.of("message", "Retiro confirmado correctamente"));

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // para cancelar el retiro qr y liberar los billetes reservados
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