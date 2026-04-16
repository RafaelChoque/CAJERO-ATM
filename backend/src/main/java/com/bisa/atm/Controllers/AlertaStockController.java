package com.bisa.atm.Controllers;

import com.bisa.atm.Services.AlertaStockService;
import com.bisa.atm.dto.AlertaStockDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/alertas")
@CrossOrigin(origins = "*")
public class AlertaStockController {

    private final AlertaStockService alertaStockService;

    // obtiene las alerta de stock bajo
    public AlertaStockController(AlertaStockService alertaStockService) {
        this.alertaStockService = alertaStockService;
    }

    // obtiene las alertas de stock bajo de todos los cajeros
    @GetMapping("/stock-bajo")
    public ResponseEntity<List<AlertaStockDto>> obtenerAlertasStock() {
        return ResponseEntity.ok(alertaStockService.obtenerAlertasStock());
    }

    //obtiene las alertas de stock bajo de un cajero especifico
    @GetMapping("/stock-bajo/{idCajero}")
    public ResponseEntity<List<AlertaStockDto>> obtenerAlertasStockPorCajero(@PathVariable Long idCajero) {
        return ResponseEntity.ok(alertaStockService.obtenerAlertasStockPorCajero(idCajero));
    }
}