package com.bisa.atm.Services;

import com.bisa.atm.Entities.Billete;
import com.bisa.atm.Entities.Caseta;
import com.bisa.atm.Repositories.BilleteRepository;
import com.bisa.atm.Repositories.CasetaRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.util.*;

@Service
public class BilleteService {

    private final BilleteRepository billeteRepository;
    private final CasetaRepository casetaRepository;
    private final AuditoriaService auditoriaService;

    public BilleteService(
            BilleteRepository billeteRepository,
            CasetaRepository casetaRepository,
            AuditoriaService auditoriaService
    ) {
        this.billeteRepository = billeteRepository;
        this.casetaRepository = casetaRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public void cargarBilletesDesdeExcel(Long idCaseta, MultipartFile archivo) {
        Caseta caseta = null;

        try {
            caseta = casetaRepository.findById(idCaseta)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caseta no encontrada"));

            if (!"ACTIVA".equalsIgnoreCase(caseta.getEstado())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La caseta no está activa");
            }

            List<Billete> nuevosBilletes = procesarExcelYCrearBilletes(archivo, Collections.singletonList(caseta));

            billeteRepository.saveAll(nuevosBilletes);
            caseta.aumentarStock(nuevosBilletes.size());
            casetaRepository.save(caseta);

            auditoriaService.registrar(
                    "BILLETES",
                    "CARGA_EXCEL",
                    "CASETA",
                    caseta.getIdCaseta(),
                    "EXITOSO",
                    "Se cargaron billetes en una caseta desde Excel",
                    null,
                    caseta.getCajero() != null ? caseta.getCajero().getIdCajero() : null,
                    null,
                    "{\"cantidadBilletes\":" + nuevosBilletes.size() + ",\"denominacion\":" + caseta.getDenominacion() + "}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "BILLETES",
                    "CARGA_EXCEL",
                    "CASETA",
                    idCaseta,
                    "FALLIDO",
                    "Falló la carga de billetes desde Excel: " + e.getMessage(),
                    null,
                    caseta != null && caseta.getCajero() != null ? caseta.getCajero().getIdCajero() : null,
                    null,
                    null
            );
            throw e;
        }
    }

    @Transactional
    public void cargarRemesaMaestra(Long idCajero, MultipartFile archivo) {
        try {
            List<Caseta> casetasDelCajero = casetaRepository.findByCajero_IdCajeroAndEstadoOrderByDenominacionDesc(idCajero, "ACTIVA");

            if (casetasDelCajero.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El cajero no tiene casetas activas.");
            }

            List<Billete> nuevosBilletes = procesarExcelYCrearBilletes(archivo, casetasDelCajero);

            Map<Long, Integer> stockAgregadoPorCaseta = new HashMap<>();
            for (Billete b : nuevosBilletes) {
                stockAgregadoPorCaseta.put(
                        b.getCaseta().getIdCaseta(),
                        stockAgregadoPorCaseta.getOrDefault(b.getCaseta().getIdCaseta(), 0) + 1
                );
            }

            for (Caseta c : casetasDelCajero) {
                int cantidadNueva = stockAgregadoPorCaseta.getOrDefault(c.getIdCaseta(), 0);
                if (cantidadNueva > 0) {
                    c.aumentarStock(cantidadNueva);
                    casetaRepository.save(c);
                }
            }

            billeteRepository.saveAll(nuevosBilletes);

            auditoriaService.registrar(
                    "BILLETES",
                    "CARGA_REMESA",
                    "CAJERO",
                    idCajero,
                    "EXITOSO",
                    "Se cargó una remesa maestra al cajero",
                    null,
                    idCajero,
                    null,
                    "{\"cantidadBilletes\":" + nuevosBilletes.size() + "}"
            );

        } catch (Exception e) {
            auditoriaService.registrar(
                    "BILLETES",
                    "CARGA_REMESA",
                    "CAJERO",
                    idCajero,
                    "FALLIDO",
                    "Falló la carga de remesa maestra: " + e.getMessage(),
                    null,
                    idCajero,
                    null,
                    null
            );
            throw e;
        }
    }

    private List<Billete> procesarExcelYCrearBilletes(MultipartFile archivo, List<Caseta> casetasDisponibles) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Archivo Excel no válido");
        }

        List<Billete> nuevosBilletes = new ArrayList<>();
        Set<String> seriesEnArchivo = new HashSet<>();

        try (InputStream is = archivo.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Cell cellDenom = row.getCell(0);
                if (cellDenom == null) continue;
                int denominacionExcel = (int) cellDenom.getNumericCellValue();

                Caseta casetaDestino = casetasDisponibles.stream()
                        .filter(c -> c.getDenominacion() == denominacionExcel)
                        .findFirst()
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "No hay una caseta válida para billetes de " + denominacionExcel + " Bs en esta operación."
                        ));

                Cell cellSerie = row.getCell(1);
                String serieLetra = formatter.formatCellValue(cellSerie).trim().toUpperCase();

                Cell cellNumero = row.getCell(2);
                String numeroSerie = formatter.formatCellValue(cellNumero).trim();

                if (numeroSerie.isEmpty()) continue;

                if (esBilleteInhabilitado(denominacionExcel, serieLetra, numeroSerie)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "¡Alerta BCB! El billete de " + denominacionExcel + " Bs (Serie " + serieLetra + ", Nro: " + numeroSerie + ") " +
                                    "pertenece al lote inhabilitado por el Banco Central de Bolivia. Entréguelo a una entidad financiera autorizada."
                    );
                }

                if (!seriesEnArchivo.add(numeroSerie)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Número de serie repetido en el archivo: " + numeroSerie);
                }

                if (billeteRepository.existsByNumeroSerie(numeroSerie)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "El número de serie ya existe en la bóveda: " + numeroSerie);
                }

                nuevosBilletes.add(new Billete(numeroSerie, serieLetra, denominacionExcel, casetaDestino));
            }

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error al leer Excel: " + e.getMessage());
        }

        if (nuevosBilletes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo no contiene billetes válidos");
        }

        Map<Long, Integer> conteoPorCaseta = new HashMap<>();
        for (Billete b : nuevosBilletes) {
            long idC = b.getCaseta().getIdCaseta();
            conteoPorCaseta.put(idC, conteoPorCaseta.getOrDefault(idC, 0) + 1);
        }

        for (Caseta c : casetasDisponibles) {
            int aCargar = conteoPorCaseta.getOrDefault(c.getIdCaseta(), 0);
            if (c.getStockActual() + aCargar > c.getCapacidadMaxima()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La carga de billetes de " + c.getDenominacion() + " Bs supera la capacidad máxima de la caseta."
                );
            }
        }

        return nuevosBilletes;
    }

    public boolean esBilleteInhabilitado(int denominacion, String serie, String numeroSerieStr) {
        if (!serie.equals("B")) {
            return false;
        }

        try {
            long numero = Long.parseLong(numeroSerieStr);

            if (denominacion == 10) {
                if (numero >= 67250001 && numero <= 67700000) return true;
                if (numero >= 69050001 && numero <= 69500000) return true;
                if (numero >= 69500001 && numero <= 69950000) return true;
                if (numero >= 69950001 && numero <= 70400000) return true;
                if (numero >= 70400001 && numero <= 70850000) return true;
                if (numero >= 70850001 && numero <= 71300000) return true;
                if (numero >= 76310012 && numero <= 85139995) return true;
                if (numero >= 86400001 && numero <= 86850000) return true;
                if (numero >= 90900001 && numero <= 91350000) return true;
                if (numero >= 91800001 && numero <= 92250000) return true;
            } else if (denominacion == 20) {
                if (numero >= 87280145 && numero <= 91646549) return true;
                if (numero >= 96650001 && numero <= 97100000) return true;
                if (numero >= 99800001 && numero <= 100250000) return true;
                if (numero >= 100250001 && numero <= 100700000) return true;
                if (numero >= 109250001 && numero <= 109700000) return true;
                if (numero >= 110600001 && numero <= 111050000) return true;
                if (numero >= 111050001 && numero <= 111500000) return true;
                if (numero >= 111950001 && numero <= 112400000) return true;
                if (numero >= 112400001 && numero <= 112850000) return true;
                if (numero >= 112850001 && numero <= 113300000) return true;
                if (numero >= 114200001 && numero <= 114650000) return true;
                if (numero >= 114650001 && numero <= 115100000) return true;
                if (numero >= 115100001 && numero <= 115550000) return true;
                if (numero >= 118700001 && numero <= 119150000) return true;
                if (numero >= 119150001 && numero <= 119600000) return true;
                if (numero >= 120500001 && numero <= 120950000) return true;
            } else if (denominacion == 50) {
                if (numero >= 77100001 && numero <= 77550000) return true;
                if (numero >= 78000001 && numero <= 78450000) return true;
                if (numero >= 78900001 && numero <= 96350000) return true;
                if (numero >= 96350001 && numero <= 96800000) return true;
                if (numero >= 96800001 && numero <= 97250000) return true;
                if (numero >= 98150001 && numero <= 98600000) return true;
                if (numero >= 104900001 && numero <= 105350000) return true;
                if (numero >= 105350001 && numero <= 105800000) return true;
                if (numero >= 106700001 && numero <= 107150000) return true;
                if (numero >= 107600001 && numero <= 108050000) return true;
                if (numero >= 108050001 && numero <= 108500000) return true;
                if (numero >= 109400001 && numero <= 109850000) return true;
            }
        } catch (NumberFormatException e) {
            return true;
        }

        return false;
    }
}