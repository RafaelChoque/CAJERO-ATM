package com.bisa.atm.Controllers;

import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.dto.LoginRequest;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.Services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;
    @Autowired
    private CajeroRepository cajeroRepository;
    @Autowired
    private CuentaBancariaRepository cuentaBancariaRepository;

    //recibe las credenciales del admin, y lo valida con la bd y les da su token JWT
    @PostMapping("/login-admin")
    public ResponseEntity<?> loginAdmin(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.loginAdmin(request.getNombreUsuario(), request.getContrasena()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    // igual pero para el cliente PERO para la app movil y avisa si tiene que cambiar su contraseña si entra por primera vez
    @PostMapping("/login-cliente")
    public ResponseEntity<?> loginCliente(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.loginCliente(request.getNombreUsuario(), request.getContrasena()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    // cuando el cliente entra por primera vez y tiene que cambiar su contra temporal que le llego al correo
    @PostMapping("/cambiar-password")
    public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, Object> body) {
        try {
            Long idUsuario = Long.valueOf(body.get("idUsuario").toString());
            String nuevaPassword = body.get("nuevaPassword").toString();
            authService.cambiarPassword(idUsuario, nuevaPassword);
            return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente. Ya puede iniciar sesión."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al actualizar: " + e.getMessage()));
        }
    }

    // coordenadas de los cajeros activos para mostrar en el mapa de la app
    @GetMapping("/cajeros-cercanos")
    public ResponseEntity<?> obtenerCajerosPublicos() {
        try {
            List<Map<String, Object>> cajerosActivos = cajeroRepository.findAll().stream()
                    .filter(c -> "ACTIVO".equals(c.getEstado()) && c.getLatitud() != null)
                    .map(c -> Map.<String, Object>of(
                            "codigo", c.getCodigoCajero(),
                            "ubicacion", c.getUbicacion(),
                            "latitud", c.getLatitud(),
                            "longitud", c.getLongitud()
                    ))
                    .toList();
            return ResponseEntity.ok(cajerosActivos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error al cargar mapa"));
        }
    }

    // el cliente puede ver el detalle de su cuenta
    @GetMapping("/cuenta/{idCuenta}")
    public ResponseEntity<?> obtenerCuenta(@PathVariable Long idCuenta) {
        try {
            CuentaBancaria cuenta = cuentaBancariaRepository.findById(idCuenta)
                    .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

            return ResponseEntity.ok(Map.of(
                    "idCuenta", cuenta.getIdCuenta(),
                    "saldo", cuenta.getSaldo(),
                    "moneda", cuenta.getMoneda(),
                    "tipoCuenta", cuenta.getTipoCuenta(),
                    "numeroCuenta", cuenta.getNumeroCuenta()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}