package com.bisa.atm.Controllers;

import com.bisa.atm.Services.TokenQrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bisa.atm.dto.TokenQrRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/qr")
@CrossOrigin(origins = "*")
public class TokenQrController {

    @Autowired
    private TokenQrService tokenQrService;

    //el cajero pide generar un token QR y esto le devuelve el codigo neuvo y con tiempo de caducidad
    @PostMapping("/generar/{idCajero}")
    public ResponseEntity<?> generarQr(@PathVariable Long idCajero) {
        try {
            String codigo = tokenQrService.generarToken(idCajero);
            return ResponseEntity.ok(Map.of("codigoToken", codigo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // el cliente escanea el QR y envia el codigo y su id de cuenta pa vincularlo y que el cajero reconozca
    @PostMapping("/vincular")
    public ResponseEntity<?> vincularQr(@RequestBody TokenQrRequest request) {
        try {
            tokenQrService.vincularToken(request.getCodigoToken(), request.getIdCuenta());

            return ResponseEntity.ok(Map.of("message", "Vínculo exitoso"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // revisa el estado del token par que el cajero sepa si ya se vinculo con un cliente
    @GetMapping("/estado/{codigoToken}")
    public ResponseEntity<?> consultarEstado(@PathVariable String codigoToken) {
        try {
            Map<String, Object> estado = tokenQrService.consultarEstado(codigoToken);
            return ResponseEntity.ok(estado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // el cajero recibe el pin ingresado por el cliente y lo valida
    @PostMapping("/validar-pin")
    public ResponseEntity<?> validarPinCajero(@RequestBody Map<String, Object> payload) {
        try {
            Long idCuenta = Long.valueOf(payload.get("idCuenta").toString());
            String pinIngresado = payload.get("pin").toString();

            tokenQrService.validarPinCajero(idCuenta, pinIngresado);
            return ResponseEntity.ok(Map.of("valido", true, "mensaje", "PIN Correcto"));

        } catch (Exception e) {
            if (e.getMessage().equals("PIN Incorrecto")) {
                return ResponseEntity.badRequest().body(Map.of("valido", false, "mensaje", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}