package com.bisa.atm.Controllers;

import com.bisa.atm.Services.BilleteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/qr")
@CrossOrigin(origins = "*")
public class ValidadorController {

    private final BilleteService billeteService;

    public ValidadorController(BilleteService billeteService) {
        this.billeteService = billeteService;
    }

    // para validar billetes fisicos reportados como extraviados (serie B)
    @GetMapping("/validar-fisico")
    public ResponseEntity<?> validarBilleteFisico(
            @RequestParam int denominacion,
            @RequestParam String serie,
            @RequestParam String numero) {

        boolean inhabilitado = billeteService.esBilleteInhabilitado(denominacion, serie, numero);

        if (inhabilitado) {
            return ResponseEntity.ok(Map.of(
                    "valido", false,
                    "mensaje", "¡ALERTA BCB! El billete de " + denominacion + " Bs (Serie " + serie + ", Nro: " + numero + ") está inhabilitado por robo/extravío. Reténgalo."
            ));
        } else {
            return ResponseEntity.ok(Map.of(
                    "valido", true,
                    "mensaje", "Billete legal. Apto para depósito o circulación."
            ));
        }
    }
}