package com.bisa.atm.Services;

import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.Repositories.TransaccionRepository;
import com.bisa.atm.dto.MarkovMetricsDto;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CadenasMarkovService {

    private final CajeroRepository cajeroRepository;
    private final TransaccionRepository transaccionRepository;

    public CadenasMarkovService(CajeroRepository cajeroRepository, TransaccionRepository transaccionRepository) {
        this.cajeroRepository = cajeroRepository;
        this.transaccionRepository = transaccionRepository;
    }

    public List<MarkovMetricsDto> calcularEstadosEstables() {
        List<Cajero> cajeros = cajeroRepository.findAll();
        List<MarkovMetricsDto> metricas = new ArrayList<>();

        LocalDateTime hace24Horas = LocalDateTime.now().minusHours(24);

        for (Cajero cajero : cajeros) {
            long transaccionesHoy = transaccionRepository.countByCajeroAndFechaHoraAfter(cajero, hace24Horas);

            // 1. Probabilidades Base
            double p11 = 0.70, p12 = 0.25, p13 = 0.05; // Si está Óptimo
            double p21 = 0.40, p22 = 0.40, p23 = 0.20; // Si está en Riesgo (bajos billetes)
            double p31 = 0.80, p32 = 0.10, p33 = 0.10; // Si está en Mantenimiento

            // 2. Modificadores de la Matriz según el estado real del cajero:

            // A) Nivel de uso en las últimas 24 horas
            if (transaccionesHoy == 0) {
                // Sin uso reciente -> Altísima probabilidad de quedarse estable
                p11 = 0.85; p12 = 0.10; p13 = 0.05;
            } else if (transaccionesHoy > 0 && transaccionesHoy <= 5) {
                // Poco uso (Tu caso del cajero con 1 transacción) -> Ligeramente desgastado
                p11 = 0.75; p12 = 0.20; p13 = 0.05;
            } else if (transaccionesHoy > 5) {
                // Uso moderado/alto
                p11 = 0.50; p12 = 0.35; p13 = 0.15;
            }

            // B) Verificación de Stock (Si el cajero lo acabas de crear y no tiene casetas/efectivo)
            if (cajero.getCasetas() == null || cajero.getCasetas().isEmpty()) {
                // Si no tiene dinero, la probabilidad de caer a Mantenimiento o Riesgo se dispara
                p11 = 0.10; p12 = 0.30; p13 = 0.60;
            }

            // C) Si un administrador lo puso manualmente en Mantenimiento
            if ("MANTENIMIENTO".equalsIgnoreCase(cajero.getEstado())) {
                p11 = 0.20; p12 = 0.30; p13 = 0.50;
            }

            // Construir la matriz
            double[][] matrizP = {
                    {p11, p12, p13},
                    {p21, p22, p23},
                    {p31, p32, p33}
            };

            // 3. Multiplicación de Markov (P^n) para Estado Estable
            double[] vectorEstado = {1.0, 0.0, 0.0};

            for (int i = 0; i < 20; i++) {
                double[] nuevoVector = new double[3];
                nuevoVector[0] = vectorEstado[0]*matrizP[0][0] + vectorEstado[1]*matrizP[1][0] + vectorEstado[2]*matrizP[2][0];
                nuevoVector[1] = vectorEstado[0]*matrizP[0][1] + vectorEstado[1]*matrizP[1][1] + vectorEstado[2]*matrizP[2][1];
                nuevoVector[2] = vectorEstado[0]*matrizP[0][2] + vectorEstado[1]*matrizP[1][2] + vectorEstado[2]*matrizP[2][2];
                vectorEstado = nuevoVector;
            }

            // 4. Empaquetar resultado
            MarkovMetricsDto dto = new MarkovMetricsDto();
            dto.setIdCajero(cajero.getIdCajero());
            dto.setCodigoCajero(cajero.getCodigoCajero());
            dto.setEstadoActual(cajero.getEstado());

            dto.setProbOptimo(vectorEstado[0] * 100);
            dto.setProbRiesgo(vectorEstado[1] * 100);
            dto.setProbMantenimiento(vectorEstado[2] * 100);

            if (vectorEstado[2] > 20.0) { // Si probabilidad de falla es > 20%
                dto.setRecomendacionPredictiva("Alerta Crítica: Requiere recarga de efectivo o soporte técnico.");
            } else if (vectorEstado[1] > 25.0) {
                dto.setRecomendacionPredictiva("Monitoreo Sugerido: Stock descendiendo.");
            } else {
                dto.setRecomendacionPredictiva("Sistema estable a largo plazo.");
            }

            metricas.add(dto);
        }
        return metricas;
    }
}