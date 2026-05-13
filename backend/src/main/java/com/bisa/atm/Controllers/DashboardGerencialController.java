package com.bisa.atm.Controllers;

import com.bisa.atm.Services.DashboardGerencialService;
import com.bisa.atm.dto.DashboardGerencialDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = "*")
public class DashboardGerencialController {

    private final DashboardGerencialService dashboardGerencialService;

    public DashboardGerencialController(DashboardGerencialService dashboardGerencialService) {
        this.dashboardGerencialService = dashboardGerencialService;
    }

    @GetMapping
    public ResponseEntity<DashboardGerencialDto> obtenerDashboard() {
        return ResponseEntity.ok(dashboardGerencialService.obtenerResumen());
    }
}