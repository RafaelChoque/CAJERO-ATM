package com.bisa.atm.Controllers;

import com.bisa.atm.Services.CasetaService;
import com.bisa.atm.dto.CasetaDto;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/cajeros")
public class CasetaController {

    private final CasetaService casetaService;

    // Inyección de dependencias del servicio de casetas
    public CasetaController(CasetaService casetaService) {
        this.casetaService = casetaService;
    }

    // listar casetas de un cajero especifico noma
    @GetMapping("/{idCajero}/casetas")
    public List<CasetaDto> listarCasetasPorCajero(@PathVariable Long idCajero) {
        return casetaService.listarCasetasPorCajero(idCajero);
    }
}