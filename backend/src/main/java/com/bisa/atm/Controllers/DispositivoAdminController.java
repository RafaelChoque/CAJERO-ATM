package com.bisa.atm.Controllers;

import com.bisa.atm.Services.DispositivoService;
import com.bisa.atm.dto.DispositivoDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dispositivos")
@CrossOrigin(origins = "*")
public class DispositivoAdminController {

    @Autowired
    private DispositivoService dispositivoService;

    // Listar todos los dispositivos
    @GetMapping("/listar")
    public ResponseEntity<List<DispositivoDto>> listarDispositivos() {
        try {
            return ResponseEntity.ok(dispositivoService.listarTodos());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Bloquear dispositivo
    @PostMapping("/bloquear/{idDispositivo}")
    public ResponseEntity<?> bloquearDispositivo(@PathVariable Long idDispositivo) {
        try {
            dispositivoService.bloquearDispositivo(idDispositivo);
            return ResponseEntity.ok(Map.of("message", "Dispositivo bloqueado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Error al bloquear: " + e.getMessage()));
        }
    }

    // Desbloquear dispositivo
    @PostMapping("/desbloquear/{idDispositivo}")
    public ResponseEntity<?> desbloquearDispositivo(@PathVariable Long idDispositivo) {
        try {
            dispositivoService.desbloquearDispositivo(idDispositivo);
            return ResponseEntity.ok(Map.of("message", "Dispositivo desbloqueado e ID regenerado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Error al desbloquear: " + e.getMessage()));
        }
    }

    // Eliminar registro de dispositivo
    @DeleteMapping("/eliminar/{idDispositivo}")
    public ResponseEntity<?> eliminarDispositivo(@PathVariable Long idDispositivo) {
        try {
            dispositivoService.eliminarDispositivo(idDispositivo);
            return ResponseEntity.ok(Map.of("message", "Registro de dispositivo eliminado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Error al eliminar: " + e.getMessage()));
        }
    }
}