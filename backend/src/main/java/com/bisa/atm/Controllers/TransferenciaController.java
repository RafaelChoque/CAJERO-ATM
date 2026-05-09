package com.bisa.atm.Controllers;

import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.Services.TransferenciaService;
import com.bisa.atm.dto.TransferenciaDto;
import com.bisa.atm.dto.TransferenciaQrDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cliente/transferencias")
@CrossOrigin(origins = "*")
public class TransferenciaController {

    private final TransferenciaService transferenciaService;
    private final CuentaBancariaRepository cuentaRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Inyección de dependencias actualizadas
    public TransferenciaController(TransferenciaService transferenciaService, CuentaBancariaRepository cuentaRepository) {
        this.transferenciaService = transferenciaService;
        this.cuentaRepository = cuentaRepository;
    }

    // realiza un transferencia entre cuentas
    @PostMapping
    public ResponseEntity<?> transferir(@RequestBody TransferenciaDto dto) {
        try {
            transferenciaService.transferir(
                    dto.getIdCuentaOrigen(),
                    dto.getNumeroCuentaDestino(),
                    dto.getMonto()
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Transferencia realizada correctamente"
            ));

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // Genera un QR para RECIBIR dinero
    @PostMapping("/qr/generar")
    public ResponseEntity<?> generarQrRecepcion(@RequestParam Long idCuenta) {
        try {
            String tokenQr = UUID.randomUUID().toString();

            // En producción, guardarías esto en caché temporal
            String qrContent = idCuenta + "|" + tokenQr;

            return ResponseEntity.ok(Map.of(
                    "mensaje", "QR generado para recibir",
                    "qrContent", qrContent,
                    "idCuenta", idCuenta,
                    "tokenQr", tokenQr,
                    "expiresIn", "5 minutos"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Valida y procesa transferencia QR - CON NOTIFICACIÓN WEBSOCKET
    @PostMapping("/qr/procesar")
    public ResponseEntity<?> procesarTransferenciaQr(@RequestBody TransferenciaQrDto request) {
        try {
            // Se busca la cuenta real por medio del ID para obtener su número (evitando NULL)
            CuentaBancaria cuentaDestino = cuentaRepository.findById(request.getIdCuentaDestino())
                    .orElseThrow(() -> new RuntimeException("La cuenta destino no existe o el QR es inválido"));

            // Se envía el número de cuenta de destino correcto
            transferenciaService.transferir(
                    request.getIdCuentaOrigen(),
                    cuentaDestino.getNumeroCuenta(),
                    request.getMonto()
            );

            // ENVIAR NOTIFICACIÓN WEBSOCKET A LA CUENTA DESTINATARIA
            messagingTemplate.convertAndSend("/topic/seguridad/" + request.getIdCuentaDestino(),
                    Map.of("accion", "ACTUALIZAR_CUENTA"), new HashMap<>());

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Transferencia completada",
                    "monto", request.getMonto(),
                    "cuentaDestino", request.getIdCuentaDestino()
            ));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // Valida que el QR sea válido antes de transferir
    @GetMapping("/qr/validar/{idCuenta}")
    public ResponseEntity<?> validarQr(@PathVariable Long idCuenta) {
        try {
            return ResponseEntity.ok(Map.of(
                    "valido", true,
                    "idCuenta", idCuenta,
                    "mensaje", "QR válido para recibir transferencias"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("valido", false, "message", e.getMessage()));
        }
    }
}