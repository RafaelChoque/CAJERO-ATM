package com.bisa.atm.Controllers;

import com.bisa.atm.Services.CadenasMarkovService;
import com.bisa.atm.Services.DashboardGerencialService;
import com.bisa.atm.Services.PrediccionAgotamientoService;
import com.bisa.atm.dto.DashboardGerencialDto;
import com.bisa.atm.dto.MarkovMetricsDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bisa.atm.Services.TeoriaColasService;
import com.bisa.atm.dto.QueueMetricsDto;
import com.bisa.atm.Services.PrediccionAgotamientoService;
import com.bisa.atm.dto.PrediccionAgotamientoDto;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = "*")
public class DashboardGerencialController {

    private final DashboardGerencialService dashboardGerencialService;
    private final TeoriaColasService teoriaColasService;
    private final CadenasMarkovService cadenasMarkovService;
    private final PrediccionAgotamientoService prediccionAgotamientoService;

    // Solo un constructor con ambos servicios
    public DashboardGerencialController(
            DashboardGerencialService dashboardGerencialService,
            TeoriaColasService teoriaColasService,
            CadenasMarkovService cadenasMarkovService,
            PrediccionAgotamientoService prediccionAgotamientoService) {
        this.dashboardGerencialService = dashboardGerencialService;
        this.teoriaColasService = teoriaColasService;
        this.cadenasMarkovService = cadenasMarkovService;
        this.prediccionAgotamientoService = prediccionAgotamientoService;
    }

    @GetMapping
    public ResponseEntity<DashboardGerencialDto> obtenerDashboard() {
        return ResponseEntity.ok(dashboardGerencialService.obtenerResumen());
    }

    @GetMapping("/metricas-colas")
    public ResponseEntity<List<QueueMetricsDto>> obtenerMetricasColas() {
        return ResponseEntity.ok(teoriaColasService.calcularMetricasM1());
    }
    @GetMapping("/metricas-markov")
    public ResponseEntity<List<MarkovMetricsDto>> obtenerMetricasMarkov() {
        return ResponseEntity.ok(cadenasMarkovService.calcularEstadosEstables());
    }
    @GetMapping("/metricas-agotamiento")
    public ResponseEntity<List<PrediccionAgotamientoDto>> obtenerPrediccionAgotamiento() {
        try {
            return ResponseEntity.ok(prediccionAgotamientoService.calcularPrediccionAgotamiento());
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}