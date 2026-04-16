package com.bisa.atm.Controllers;

import com.bisa.atm.Services.TransferenciaService;
import com.bisa.atm.dto.TransferenciaDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cliente/transferencias")
@CrossOrigin(origins = "*")
public class TransferenciaController {

    private final TransferenciaService transferenciaService;

    // Inyección de dependencia del servicio de transferencia
    public TransferenciaController(TransferenciaService transferenciaService) {
        this.transferenciaService = transferenciaService;
    }

    // realiza un transferencia entre cuentas
    @PostMapping
    public ResponseEntity<?> transferir(@RequestBody TransferenciaDto dto) {
        try {
            transferenciaService.transferir(
                    dto.getIdCuentaOrigen(),
                    dto.getNumeroCuentaDestino(),
                    dto.getMonto()
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Transferencia realizada correctamente"
            ));

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}