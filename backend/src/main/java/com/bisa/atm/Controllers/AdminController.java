package com.bisa.atm.Controllers;

import com.bisa.atm.dto.CajeroDto;
import com.bisa.atm.dto.ClienteDto;
import com.bisa.atm.dto.RecargaGavetaDto;
import com.bisa.atm.Services.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/clientes")
    public ResponseEntity<List<ClienteDto>> obtenerClientes() {
        return ResponseEntity.ok(adminService.obtenerTodosLosClientes());
    }

    @PostMapping("/clientes/{id}/{accion}")
    public ResponseEntity<?> cambiarEstadoCliente(@PathVariable Long id, @PathVariable String accion) {
        adminService.cambiarEstadoCliente(id, accion);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/cajeros")
    public ResponseEntity<List<CajeroDto>> obtenerCajeros() {
        return ResponseEntity.ok(adminService.obtenerTodosLosCajeros());
    }

    @PostMapping("/cajeros/recargar/{id}")
    public ResponseEntity<?> recargarCajero(@PathVariable Long id, @RequestBody List<RecargaGavetaDto> recargas) {
        adminService.recargarGavetas(id, recargas);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cajeros")
    public ResponseEntity<?> registrarCajero(@RequestBody CajeroDto cajeroDto) {
        adminService.registrarCajero(cajeroDto);
        return ResponseEntity.ok().build();
    }
}