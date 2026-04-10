package com.bisa.atm.Controllers;

import com.bisa.atm.dto.ClienteDto;
import com.bisa.atm.dto.ClienteRegistroDto;
import com.bisa.atm.dto.ClienteEditarDto;
import com.bisa.atm.Services.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    // devuelve la lista completa de clientes para mostrarlo en la tabla
    @GetMapping("/listar")
    public ResponseEntity<List<ClienteDto>> obtenerClientes() {
        return ResponseEntity.ok(clienteService.obtenerTodosLosClientes());
    }

    // Recibe los datos del cliente y guarda un nuevo cliente junto con su cuenta bancaria
    @PostMapping("/registrar")
    public ResponseEntity<?> registrarCliente(@RequestBody ClienteRegistroDto dto) {
        try {
            clienteService.registrarNuevoCliente(dto);
            return ResponseEntity.ok(Map.of("message", "Cliente y Cuenta Bancaria creados con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al registrar: " + e.getMessage()));
        }
    }

    // busca un cliente por su id y devuelve sus datos para mostrar en el formulario de edicion
    @PutMapping("/actualizar/{id}")
    public ResponseEntity<?> actualizarCliente(@PathVariable Long id, @RequestBody ClienteEditarDto dto) {
        try {
            clienteService.actualizarCliente(id, dto);
            return ResponseEntity.ok(Map.of("message", "Datos del cliente actualizados con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al actualizar: " + e.getMessage()));
        }
    }

    // borrado LOGICO del cliente donde solo cambia su estado a INACTIVO
    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminarCliente(@PathVariable Long id) {
        try {
            clienteService.eliminarClienteLogico(id);
            return ResponseEntity.ok(Map.of("message", "Cliente eliminado del sistema"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al eliminar: " + e.getMessage()));
        }
    }

    // cambia el estado del cliente entre ACTIVO e INACTIVO
    @PostMapping("/estado/{id}/{accion}")
    public ResponseEntity<?> cambiarEstadoCliente(@PathVariable Long id, @PathVariable String accion) {
        try {
            clienteService.cambiarEstadoCliente(id, accion);
            return ResponseEntity.ok(Map.of("message", "Estado actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al cambiar estado: " + e.getMessage()));
        }
    }
}