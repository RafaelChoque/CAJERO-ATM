package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.Repositories.TransaccionRepository;
import com.bisa.atm.dto.QueueMetricsDto;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class TeoriaColasService {

    private final TransaccionRepository transaccionRepository;
    private final CajeroRepository cajeroRepository;

    public TeoriaColasService(TransaccionRepository transaccionRepository, CajeroRepository cajeroRepository) {
        this.transaccionRepository = transaccionRepository;
        this.cajeroRepository = cajeroRepository;
    }

    public List<QueueMetricsDto> calcularMetricasM1() {
        List<Cajero> cajeros = cajeroRepository.findAll();
        List<QueueMetricsDto> metricas = new ArrayList<>();

        // Supongamos que un cajero tarda en promedio 2 minutos por cliente.
        // Eso significa que PUEDE atender 30 clientes por hora (60 min / 2 min = 30)
        double mu = 30.0;

        // Rango de análisis: la última hora
        LocalDateTime haceUnaHora = LocalDateTime.now().minusHours(1);

        for (Cajero cajero : cajeros) {
            // Contamos cuántas transacciones tuvo este cajero en la última hora
            // (Necesitarás tener o crear este método en tu TransaccionRepository)
            long numeroLlegadas = transaccionRepository.countByCajeroAndFechaHoraAfter(cajero, haceUnaHora);

            double lambda = (double) numeroLlegadas;

            QueueMetricsDto dto = new QueueMetricsDto();
            dto.setIdCajero(cajero.getIdCajero());
            dto.setCodigoCajero(cajero.getCodigoCajero());
            dto.setLambda(lambda);
            dto.setMu(mu);

            if (lambda > 0 && lambda < mu) {
                // Fórmulas de Teoría de Colas (M/M/1)
                double rho = lambda / mu;
                double lq = Math.pow(rho, 2) / (1 - rho); // Clientes en cola
                double wqHoras = lq / lambda;
                double wqMinutos = wqHoras * 60; // Tiempo en minutos

                dto.setRho(rho * 100); // En porcentaje
                dto.setLq(lq);
                dto.setWq(wqMinutos);

                if (rho > 0.85) {
                    dto.setAlerta("ALTA CONGESTIÓN: Considere derivar clientes a la App Móvil.");
                } else {
                    dto.setAlerta("Flujo normal.");
                }
            } else if (lambda >= mu) {
                // El sistema colapsa matemáticamente (Cola infinita)
                dto.setRho(100);
                dto.setLq(999);
                dto.setWq(999);
                dto.setAlerta("SISTEMA COLAPSADO: Demasiadas llegadas para la capacidad del cajero.");
            } else {
                dto.setRho(0);
                dto.setLq(0);
                dto.setWq(0);
                dto.setAlerta("Cajero Inactivo o sin visitas recientes.");
            }

            metricas.add(dto);
        }
        return metricas;
    }
}