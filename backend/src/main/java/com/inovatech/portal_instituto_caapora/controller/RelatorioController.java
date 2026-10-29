package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.dto.response.RelatorioResponseDTO;
import com.inovatech.portal_instituto_caapora.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

// Relatório de ocorrências. Todos os filtros são opcionais.
@RestController
@RequestMapping("/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService relatorioService;

    // GET /relatorios?inicio=2026-10-01T00:00:00&fim=2026-10-31T23:59:59&equipeId=2
    @GetMapping
    public RelatorioResponseDTO gerar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim,
            @RequestParam(required = false) Long equipeId) {
        return relatorioService.gerar(inicio, fim, equipeId);
    }
}
