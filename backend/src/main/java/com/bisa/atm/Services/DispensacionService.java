package com.bisa.atm.Services;

import com.bisa.atm.Entities.Billete;
import com.bisa.atm.Entities.Cajero;
import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Repositories.BilleteRepository;
import com.bisa.atm.Repositories.CajeroRepository;
import com.bisa.atm.Repositories.CasetaRepository;
import com.bisa.atm.dto.DetalleDispensacionDto;
import com.bisa.atm.dto.ResultadoDispensacionDto;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DispensacionService {

    private final CajeroRepository cajeroRepository;
    private final CasetaRepository casetaRepository;
    private final BilleteRepository billeteRepository;

    public DispensacionService(CajeroRepository cajeroRepository, CasetaRepository casetaRepository, BilleteRepository billeteRepository){
        this.cajeroRepository = cajeroRepository;
        this.casetaRepository = casetaRepository;
        this.billeteRepository = billeteRepository;
    }

    // Algoritmo voraz para calcular la combinacion de billetes requerida para formar el monto exacto
    public ResultadoDispensacionDto calcularDispensacionVoraz(Long idCajero, BigDecimal monto) {
        Cajero cajero = cajeroRepository.findById(idCajero)
                .orElseThrow(() -> new RuntimeException("Cajero no encontrado"));

        if (!"ACTIVO".equalsIgnoreCase(cajero.getEstado())) {
            throw new RuntimeException("El cajero no está disponible");
        }

        int montoEntero = monto.intValueExact();

        if (montoEntero <= 0) {
            throw new RuntimeException("El monto debe ser mayor a cero");
        }

        if (montoEntero % 10 != 0) {
            throw new RuntimeException("El monto debe ser multiplo de 10");
        }

        List<Caseta> casetas = casetaRepository
                .findByCajero_IdCajeroAndEstadoOrderByDenominacionDesc(idCajero, "ACTIVA");

        ResultadoDispensacionDto resultado = new ResultadoDispensacionDto();
        resultado.setMontoSolicitado(montoEntero);

        int restante = montoEntero;

        //inicia el algoritmo voraz iterando sobre cada caseta
        for (Caseta caseta : casetas) {
            int denominacion = caseta.getDenominacion();

            if (restante <= 0) {
                break;
            }

            int cantidadNecesaria = restante / denominacion;
            if (cantidadNecesaria <= 0) {
                continue;
            }

            int cantidadDisponible = caseta.getStockActual();
            int cantidadATomar = Math.min(cantidadNecesaria, cantidadDisponible);

            if (cantidadATomar > 0) {
                List<Billete> billetesDisponibles = billeteRepository
                        .findByCaseta_IdCasetaAndEstado(caseta.getIdCaseta(), "DISPONIBLE");

                if (billetesDisponibles.size() < cantidadATomar) {
                    cantidadATomar = billetesDisponibles.size();
                }

                if (cantidadATomar > 0) {
                    List<Billete> seleccionados = billetesDisponibles.subList(0, cantidadATomar);

                    DetalleDispensacionDto detalle = new DetalleDispensacionDto();
                    detalle.setDenominacion(denominacion);
                    detalle.setCantidad(cantidadATomar);
                    detalle.setIdCaseta(caseta.getIdCaseta());
                    detalle.setNumerosSerie(
                            seleccionados.stream()
                                    .map(Billete::getNumeroSerie)
                                    .toList()
                    );

                    resultado.getDetalles().add(detalle);
                    restante -= (cantidadATomar * denominacion);
                }
            }
        }

        resultado.setRestante(restante);
        resultado.setMontoDispensado(montoEntero - restante);

        if (restante != 0) {
            throw new RuntimeException("No se puede dispensar el monto exacto con el stock disponible");
        }

        return resultado;
    }

    // reserva temporalmente los billetes calculador por el algoritmo voraz
    @Transactional
    public ResultadoDispensacionDto reservarBilletes(Long idCajero, BigDecimal monto) {
        ResultadoDispensacionDto resultado = calcularDispensacionVoraz(idCajero, monto);

        for (DetalleDispensacionDto detalle : resultado.getDetalles()) {
            Caseta caseta = casetaRepository.findById(detalle.getIdCaseta())
                    .orElseThrow(() -> new RuntimeException("Caseta no encontrada"));

            for (String numeroSerie : detalle.getNumerosSerie()) {
                Billete billeteBd = billeteRepository.findByNumeroSerie(numeroSerie)
                        .orElseThrow(() -> new RuntimeException("Billete no encontrado"));

                billeteBd.reservar();
                billeteRepository.save(billeteBd);
            }

            caseta.descontarStock(detalle.getCantidad());
            casetaRepository.save(caseta);
        }

        return resultado;
    }

    //  confirma la dispensación y descontar el stock
    @Transactional
    public void confirmarDispensacion(ResultadoDispensacionDto resultado) {
        for (DetalleDispensacionDto detalle : resultado.getDetalles()) {
            for (String numeroSerie : detalle.getNumerosSerie()) {
                Billete billeteBd = billeteRepository.findByNumeroSerie(numeroSerie)
                        .orElseThrow(() -> new RuntimeException("Billete no encontrado"));

                billeteBd.dispensar();
                billeteRepository.save(billeteBd);
            }
        }
    }
    // se ejecuta si el cliente cancela el reo o si no tiene saldo suficiente
    @Transactional
    public void cancelarDispensacion(ResultadoDispensacionDto resultado) {
        for (DetalleDispensacionDto detalle : resultado.getDetalles()) {
            Caseta caseta = casetaRepository.findById(detalle.getIdCaseta())
                    .orElseThrow(() -> new RuntimeException("Caseta no encontrada"));

            for (String numeroSerie : detalle.getNumerosSerie()) {
                Billete billeteBd = billeteRepository.findByNumeroSerie(numeroSerie)
                        .orElseThrow(() -> new RuntimeException("Billete no encontrado"));

                billeteBd.liberarReserva();
                billeteRepository.save(billeteBd);
            }

            caseta.aumentarStock(detalle.getCantidad());
            casetaRepository.save(caseta);
        }
    }
}