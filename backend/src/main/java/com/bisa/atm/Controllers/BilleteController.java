package com.bisa.atm.Controllers;

import com.bisa.atm.Services.BilleteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/casetas")
@CrossOrigin(origins = "*")
public class BilleteController {

    private final BilleteService billeteService;

    //inyeccion de dependencias del servicio de billetes
    public BilleteController(BilleteService billeteService) {
        this.billeteService = billeteService;
    }

    // cargar individualmente los billetes en una caseta especfiica
    @PostMapping(value = "/{idCaseta}/cargar-billetes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> cargarBilletesIndividuales(
            @PathVariable Long idCaseta,
            @RequestParam("archivo") MultipartFile archivo
    ) {
        try {
            billeteService.cargarBilletesDesdeExcel(idCaseta, archivo);
            return ResponseEntity.ok(Map.of("message", "Caseta recargada exitosamente."));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        }
    }

    //  cargar por completo una billete en una caseta especifica
    @PostMapping(value = "/cajero/{idCajero}/cargar-remesa", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> cargarRemesaMaestra(
            @PathVariable Long idCajero,
            @RequestParam("archivo") MultipartFile archivo
    ) {
        try {
            billeteService.cargarRemesaMaestra(idCajero, archivo);
            return ResponseEntity.ok(Map.of("message", "Remesa completa procesada. Se distribuyeron los billetes en todas las casetas automáticamente."));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        }
    }
}