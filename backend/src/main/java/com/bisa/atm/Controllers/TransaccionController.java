package com.bisa.atm.Controllers;

import com.bisa.atm.Entities.Transaccion;
import com.bisa.atm.Services.TransaccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth/movimientos")
@CrossOrigin(origins = "*")
public class TransaccionController {

    @Autowired
    private TransaccionService transaccionService;

    //busca la cuenta y devuelvve todos sus movimimientos ordenados desde el mas nuevo al mas antiguo
    @GetMapping("/{idCuenta}")
    public ResponseEntity<?> obtenerMovimientos(@PathVariable Long idCuenta) {
        try {
            List<Transaccion> historial = transaccionService.obtenerHistorial(idCuenta);

            //mapear solo lo que la app necesita mostrar y no enviar datos innecesarios
            List<Map<String, Object>> respuesta = historial.stream().map(t -> Map.<String, Object>of(
                    "monto", t.getMonto(),
                    "tipoTransaccion", t.getTipoTransaccion(),
                    "numeroReferencia", t.getNumeroReferencia()
            )).collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}