package com.bisa.atm.Services;

import com.bisa.atm.Entities.Dispositivo;
import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.DispositivoRepository;
import com.bisa.atm.Repositories.UsuarioRepository;
import com.bisa.atm.dto.DispositivoDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class DispositivoService {

    @Autowired
    private DispositivoRepository dispositivoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Registrar o actualizar dispositivo al hacer login
    @Transactional
    public Dispositivo registrarOActualizarDispositivo(Long idUsuario, String dispositivoId) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        // Marcar todos los dispositivos previos como NO actuales
        List<Dispositivo> dispositivosAnteriores = dispositivoRepository.findByUsuario_IdUsuario(idUsuario);
        for (Dispositivo d : dispositivosAnteriores) {
            d.setEsActual(false);
        }
        dispositivoRepository.saveAll(dispositivosAnteriores);

        Optional<Dispositivo> dispositivoExistente = dispositivoRepository.findByDispositivoId(dispositivoId);

        if (dispositivoExistente.isPresent()) {
            Dispositivo dispositivo = dispositivoExistente.get();
            dispositivo.setUltimoLogin(LocalDateTime.now());
            dispositivo.setEsActual(true);
            return dispositivoRepository.save(dispositivo);
        } else {
            Dispositivo nuevoDispositivo = new Dispositivo(usuario, dispositivoId);
            nuevoDispositivo.setEsActual(true);
            return dispositivoRepository.save(nuevoDispositivo);
        }
    }

    // Listar todos los dispositivos
    public List<DispositivoDto> listarTodos() {
        return dispositivoRepository.listarTodos();
    }

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    // Bloquear dispositivo
    @Transactional
    public void bloquearDispositivo(Long idDispositivo) {
        Dispositivo dispositivo = dispositivoRepository.findById(idDispositivo)
                .orElseThrow(() -> new RuntimeException("Dispositivo no encontrado"));

        dispositivo.setEstaBloqueado(true);
        dispositivo.setFechaBloqueo(LocalDateTime.now());
        dispositivoRepository.save(dispositivo);
        // NOTIFICAR AL CLIENTE EN TIEMPO REAL
        Long idUsuario = dispositivo.getUsuario().getIdUsuario();
        Map<String, Object> notificacion = new HashMap<>();
        notificacion.put("accion", "DISPOSITIVO_BLOQUEADO");
        notificacion.put("dispositivoId", dispositivo.getDispositivoId());
        notificacion.put("mensaje", "Tu dispositivo ha sido bloqueado. Por favor, cierra sesión inmediatamente.");

        messagingTemplate.convertAndSend("/topic/seguridad/" + idUsuario, (Object) notificacion);;
    }

    // Desbloquear dispositivo y regenerar ID
    @Transactional
    public void desbloquearDispositivo(Long idDispositivo) {
        Dispositivo dispositivo = dispositivoRepository.findById(idDispositivo)
                .orElseThrow(() -> new RuntimeException("Dispositivo no encontrado"));

        dispositivo.setEstaBloqueado(false);
        dispositivo.setFechaBloqueo(null);
        // Regenerar ID del dispositivo
        dispositivo.setDispositivoId("DEVICE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dispositivoRepository.save(dispositivo);
    }

    // Eliminar registro de dispositivo
    @Transactional
    public void eliminarDispositivo(Long idDispositivo) {
        dispositivoRepository.deleteById(idDispositivo);
    }

    // Verificar si dispositivo está bloqueado
    public boolean estaBloqueado(String dispositivoId) {
        Optional<Dispositivo> dispositivo = dispositivoRepository.findByDispositivoId(dispositivoId);
        return dispositivo.isPresent() && dispositivo.get().getEstaBloqueado();
    }
}