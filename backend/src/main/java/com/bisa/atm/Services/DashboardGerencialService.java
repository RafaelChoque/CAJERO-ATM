package com.bisa.atm.Services;

import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Entities.Transaccion;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.Repositories.CasetaRepository;
import com.bisa.atm.Repositories.CuentaBancariaRepository;
import com.bisa.atm.Repositories.TransaccionRepository;
import com.bisa.atm.Repositories.UsuarioRepository;
import com.bisa.atm.dto.DashboardGerencialDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardGerencialService {

    private final UsuarioRepository usuarioRepository;
    private final CuentaBancariaRepository cuentaBancariaRepository;
    private final CajeroRepository cajeroRepository;
    private final CasetaRepository casetaRepository;
    private final TransaccionRepository transaccionRepository;

    public DashboardGerencialService(UsuarioRepository usuarioRepository,
                                     CuentaBancariaRepository cuentaBancariaRepository,
                                     CajeroRepository cajeroRepository,
                                     CasetaRepository casetaRepository,
                                     TransaccionRepository transaccionRepository) {
        this.usuarioRepository = usuarioRepository;
        this.cuentaBancariaRepository = cuentaBancariaRepository;
        this.cajeroRepository = cajeroRepository;
        this.casetaRepository = casetaRepository;
        this.transaccionRepository = transaccionRepository;
    }

    public DashboardGerencialDto obtenerResumen() {
        DashboardGerencialDto dto = new DashboardGerencialDto();

        dto.setTotalClientesActivos(
                usuarioRepository.countByRolAndEstado("CLIENTE", "ACTIVO")
        );

        dto.setTotalCuentas(
                cuentaBancariaRepository.count()
        );

        dto.setTotalCajerosActivos(
                cajeroRepository.countByEstado("ACTIVO")
        );

        dto.setTotalCajerosMantenimiento(
                cajeroRepository.countByEstado("MANTENIMIENTO")
        );

        List<Caseta> casetasEnAlerta = casetaRepository.findCasetasConStockBajo();
        dto.setTotalAlertasStockBajo((long) casetasEnAlerta.size());

        BigDecimal totalRetiros = transaccionRepository.sumMontoByTipoTransaccion("RETIRO");
        dto.setMontoTotalRetiros(totalRetiros != null ? totalRetiros.abs() : BigDecimal.ZERO);

        BigDecimal totalTransferenciasEnviadas =
                transaccionRepository.sumMontoByTipoTransaccion("TRANSFERENCIA ENVIADA");
        dto.setMontoTotalTransferenciasEnviadas(
                totalTransferenciasEnviadas != null ? totalTransferenciasEnviadas.abs() : BigDecimal.ZERO
        );

        // TOP 3 CAJEROS MAS UTILIZADOS EN LOS ULTIMOS 30 DIAS
        LocalDateTime fechaInicio = LocalDateTime.now().minusDays(30);

        List<Object[]> topCajeros = transaccionRepository.findTop3CajerosMasUtilizadosUltimos30Dias(
                fechaInicio,
                PageRequest.of(0, 3)
        );

        dto.setTopCajerosUtilizados(
                topCajeros.stream().map(fila -> {
                    DashboardGerencialDto.TopCajeroDto item =
                            new DashboardGerencialDto.TopCajeroDto();

                    item.setIdCajero(((Number) fila[0]).longValue());
                    item.setCodigoCajero((String) fila[1]);
                    item.setCantidadRetiros(((Number) fila[2]).longValue());
                    item.setMontoTotalRetirado((BigDecimal) fila[3]);

                    return item;
                }).toList()
        );

        List<Transaccion> ultimas = transaccionRepository.findTop10ByOrderByFechaHoraDesc();

        dto.setUltimasTransacciones(
                ultimas.stream().map(tx -> {
                    DashboardGerencialDto.TransaccionResumenDto item =
                            new DashboardGerencialDto.TransaccionResumenDto();

                    item.setIdTransaccion(tx.getIdTransaccion());
                    item.setNumeroReferencia(tx.getNumeroReferencia());
                    item.setTipoTransaccion(tx.getTipoTransaccion());
                    item.setMonto(tx.getMonto());
                    item.setSaldoResultante(tx.getSaldoResultante());
                    item.setEstado(tx.getEstado());
                    item.setFechaHora(tx.getFechaHora().toString());
                    item.setIdCuenta(tx.getCuenta() != null ? tx.getCuenta().getIdCuenta() : null);
                    item.setIdCajero(tx.getCajero() != null ? tx.getCajero().getIdCajero() : null);

                    return item;
                }).toList()
        );

        return dto;
    }
}