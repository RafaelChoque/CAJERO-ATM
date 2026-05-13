package com.bisa.atm.Services;

import com.bisa.atm.Entities.AuditoriaSistema;
import com.bisa.atm.Entities.Usuario;
import com.bisa.atm.Repositories.AuditoriaSistemaRepository;
import com.bisa.atm.Repositories.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuditoriaService {

    private final AuditoriaSistemaRepository auditoriaSistemaRepository;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaService(
            AuditoriaSistemaRepository auditoriaSistemaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.auditoriaSistemaRepository = auditoriaSistemaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(
            String modulo,
            String accion,
            String entidad,
            Long idEntidad,
            String resultado,
            String descripcion,
            Long idCuenta,
            Long idCajero,
            String numeroReferencia,
            String detallesJson
    ) {
        AuditoriaSistema log = new AuditoriaSistema();

        log.setModulo(modulo);
        log.setAccion(accion);
        log.setEntidad(entidad);
        log.setIdEntidad(idEntidad);
        log.setResultado(resultado);
        log.setDescripcion(descripcion);
        log.setIdCuenta(idCuenta);
        log.setIdCajero(idCajero);
        log.setNumeroReferencia(numeroReferencia);
        log.setDetallesJson(detallesJson);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
            log.setUsuarioActor(auth.getName());

            if (auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
                log.setRolActor(auth.getAuthorities().iterator().next().getAuthority());
            }

            usuarioRepository.findByNombreUsuario(auth.getName())
                    .ifPresent(log::setUsuario);
        }

        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                log.setIpOrigen(request.getRemoteAddr());
            }
        } catch (Exception e) {
            log.setIpOrigen("IP_NO_DISPONIBLE");
        }

        auditoriaSistemaRepository.save(log);
    }
}