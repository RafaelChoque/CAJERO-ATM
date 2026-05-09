package com.bisa.atm.Controllers;

import com.bisa.atm.dto.CajeroDto;
import com.bisa.atm.Services.CajeroAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/cajeros")
@CrossOrigin(origins = "*")
public class CajeroAdminController {

    @Autowired
    private CajeroAdminService cajeroAdminService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    //devuelve la lista completa de cajeros para mostrarlo en la tabla
    @GetMapping("/listar")
    public ResponseEntity<List<CajeroDto>> obtenerCajeros() {
        return ResponseEntity.ok(cajeroAdminService.obtenerTodosLosCajeros());
    }

    //Recibe los datos del cajero y guarda un nuevo cajero
    @PostMapping("/registrar")
    public ResponseEntity<?> registrarCajero(@RequestBody CajeroDto cajeroDto) {
        try {
            cajeroAdminService.registrarCajero(cajeroDto);

            // CORRECCIÓN: Le decimos a Java que el Map es el Object del payload
            messagingTemplate.convertAndSend("/topic/cajeros", (Object) Map.of("accion", "NUEVO_CAJERO"));

            return ResponseEntity.ok(Map.of("message", "Cajero registrado con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al registrar: " + e.getMessage()));
        }
    }

    //busca un cajero especifico y devuelve sus datos
    @PutMapping("/actualizar/{id}")
    public ResponseEntity<?> actualizarCajero(@PathVariable Long id, @RequestBody CajeroDto cajeroDto) {
        try {
            cajeroAdminService.actualizarCajero(id, cajeroDto);

            messagingTemplate.convertAndSend("/topic/cajeros", (Object) Map.of("accion", "ACTUALIZACION"));

            return ResponseEntity.ok(Map.of("message", "Cajero actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al actualizar: " + e.getMessage()));
        }
    }

    //cambia el estado del cajero entre activo a mantenimiento o viceversa
    @PostMapping("/estado/{id}/{nuevoEstado}")
    public ResponseEntity<?> cambiarEstadoCajero(@PathVariable Long id, @PathVariable String nuevoEstado) {
        try {
            cajeroAdminService.cambiarEstadoCajero(id, nuevoEstado.toUpperCase());

            messagingTemplate.convertAndSend("/topic/cajeros", (Object) Map.of("accion", "ACTUALIZACION"));

            return ResponseEntity.ok(Map.of("message", "Estado del cajero actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al cambiar estado: " + e.getMessage()));
        }
    }

    // borrado LOGICO del cajero donde solo cambia su estado a mantenimiento
    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminarCajero(@PathVariable Long id) {
        try {
            cajeroAdminService.eliminarCajeroLogico(id);

            messagingTemplate.convertAndSend("/topic/cajeros", (Object) Map.of("accion", "ACTUALIZACION"));

            return ResponseEntity.ok(Map.of("message", "Cajero dado de baja"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al eliminar: " + e.getMessage()));
        }
    }
}