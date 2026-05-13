package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.Repositories.TransaccionRepository;
import com.bisa.atm.dto.PrediccionAgotamientoDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PrediccionAgotamientoService {

    private final CajeroRepository cajeroRepository;
    private final TransaccionRepository transaccionRepository;

    public PrediccionAgotamientoService(
            CajeroRepository cajeroRepository,
            TransaccionRepository transaccionRepository) {
        this.cajeroRepository = cajeroRepository;
        this.transaccionRepository = transaccionRepository;
    }

    public List<PrediccionAgotamientoDto> calcularPrediccionAgotamiento() {
        List<Cajero> cajeros = cajeroRepository.findAll();
        List<PrediccionAgotamientoDto> predicciones = new ArrayList<>();

        LocalDateTime hace7Dias = LocalDateTime.now().minusDays(7);
        LocalDateTime hace1Dia = LocalDateTime.now().minusDays(1);

        for (Cajero cajero : cajeros) {
            // 1. Calcular dinero TOTAL disponible en el cajero (suma de todas sus casetas)
            // Dinero por Caseta = Stock Actual × Denominación
            BigDecimal totalDineroDisponible = BigDecimal.ZERO;

            if (cajero.getCasetas() != null && !cajero.getCasetas().isEmpty()) {
                for (Caseta caseta : cajero.getCasetas()) {
                    if (caseta.getStockActual() != null && caseta.getDenominacion() != null) {
                        BigDecimal montoEnCaseta = BigDecimal.valueOf(
                                (long) caseta.getStockActual() * caseta.getDenominacion()
                        );
                        totalDineroDisponible = totalDineroDisponible.add(montoEnCaseta);
                    }
                }
            }

            // 2. Calcular promedio de DINERO retirado POR DÍA en los últimos 7 días
            // TEMPORAL: Por ahora asumimos promedio = 0 hasta agregar el método en TransaccionRepository
            BigDecimal montoRetiradoUltima7Dias = BigDecimal.ZERO;
            double promedioMontoXDia = 0; // Sin datos históricos, todo tiene stock infinito

            // 3. Calcular dinero consumido últimas 24 horas
            BigDecimal montoRetiradoHoy = BigDecimal.ZERO;

            // 4. PREDICCIÓN: ¿En cuántos días se acaba el dinero?
            int diasHastaAgotamiento = 999;
            String estado = "✓ SEGURO";
            String alerta = "Stock suficiente para 30+ días.";

            if (promedioMontoXDia > 0 && totalDineroDisponible.doubleValue() > 0) {
                diasHastaAgotamiento = (int) (totalDineroDisponible.doubleValue() / promedioMontoXDia);

                if (diasHastaAgotamiento <= 1) {
                    estado = "🔴 CRÍTICO";
                    alerta = "¡URGENTE! Se agota HOY o mañana. Recargar INMEDIATAMENTE.";
                } else if (diasHastaAgotamiento <= 3) {
                    estado = "🟠 ALTO RIESGO";
                    alerta = "Se agota en " + diasHastaAgotamiento + " días. Programar recarga.";
                } else if (diasHastaAgotamiento <= 7) {
                    estado = "🟡 MONITOREO";
                    alerta = "Se agota en " + diasHastaAgotamiento + " días. Vigilar.";
                } else {
                    estado = "✓ SEGURO";
                    alerta = "Stock seguro para " + diasHastaAgotamiento + " días.";
                }
            } else if (totalDineroDisponible.doubleValue() == 0) {
                estado = "🔴 VACÍO";
                alerta = "Sin dinero disponible. Requiere recarga urgente.";
                diasHastaAgotamiento = 0;
            }

            // 5. Empaquetar resultado
            PrediccionAgotamientoDto dto = new PrediccionAgotamientoDto();
            dto.setIdCajero(cajero.getIdCajero());
            dto.setCodigoCajero(cajero.getCodigoCajero());
            dto.setTotalBilletes(totalDineroDisponible.longValue()); // Monto en Bs
            dto.setPromedioBilletesXDia(Math.round(promedioMontoXDia * 100.0) / 100.0);
            dto.setBilletesRetiradosHoy(montoRetiradoHoy.longValue());
            dto.setDiasHastaAgotamiento(diasHastaAgotamiento);
            dto.setEstado(estado);
            dto.setAlerta(alerta);

            predicciones.add(dto);
        }
        return predicciones;
    }
}