package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.dto.response.ContagemResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.DashboardResumoResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.PontoMapaResponseDTO;
import com.inovatech.portal_instituto_caapora.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Dados do painel (cards, gráficos e mapa de calor)
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // Cards de resumo
    // GET /dashboard/resumo
    @GetMapping("/resumo")
    public DashboardResumoResponseDTO resumo() {
        return dashboardService.resumo();
    }

    // GET /dashboard/por-status
    @GetMapping("/por-status")
    public List<ContagemResponseDTO> contarPorStatus() {
        return dashboardService.contarPorStatus();
    }

    // GET /dashboard/por-categoria
    @GetMapping("/por-categoria")
    public List<ContagemResponseDTO> contarPorCategoriaAnimal() {
        return dashboardService.contarPorCategoriaAnimal();
    }

    // Tendência mensal. Se não informar "meses", usa 6.
    // GET /dashboard/por-mes?meses=6
    @GetMapping("/por-mes")
    public List<ContagemResponseDTO> contarPorMes(@RequestParam(defaultValue = "6") int meses) {
        return dashboardService.contarPorMes(meses);
    }

    // Mapa de calor. Se não informar "dias", usa 90.
    // GET /dashboard/mapa-calor?dias=90
    @GetMapping("/mapa-calor")
    public List<PontoMapaResponseDTO> pontosMapaCalor(@RequestParam(defaultValue = "90") int dias) {
        return dashboardService.pontosMapaCalor(dias);
    }
}
