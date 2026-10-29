package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.dto.request.EquipeRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.EquipeDetalheResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.EquipeResponseDTO;
import com.inovatech.portal_instituto_caapora.service.EquipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Equipes de campo
@RestController
@RequestMapping("/equipes")
@RequiredArgsConstructor
public class EquipeController {

    private final EquipeService equipeService;

    // POST /equipes   corpo: { "nome": "Alfa" }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EquipeResponseDTO criar(@Valid @RequestBody EquipeRequestDTO dto) {
        return equipeService.criar(dto);
    }

    // PUT /equipes/5   corpo: { "nome": "Novo nome" }
    @PutMapping("/{id}")
    public EquipeResponseDTO renomear(@PathVariable Long id, @Valid @RequestBody EquipeRequestDTO dto) {
        return equipeService.renomear(id, dto);
    }

    // GET /equipes
    @GetMapping
    public List<EquipeResponseDTO> listar() {
        return equipeService.listar();
    }

    // Só as equipes livres (para escolher na hora de atribuir)
    // GET /equipes/disponiveis
    @GetMapping("/disponiveis")
    public List<EquipeResponseDTO> listarDisponiveis() {
        return equipeService.listarDisponiveis();
    }

    // GET /equipes/5
    @GetMapping("/{id}")
    public EquipeResponseDTO buscarPorId(@PathVariable Long id) {
        return equipeService.buscarPorId(id);
    }

    // Equipe com mais informações (ocorrência atual, histórico...)
    // GET /equipes/5/detalhe
    @GetMapping("/{id}/detalhe")
    public EquipeDetalheResponseDTO detalhar(@PathVariable Long id) {
        return equipeService.detalhar(id);
    }
}
