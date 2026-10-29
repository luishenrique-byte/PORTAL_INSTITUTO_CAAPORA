package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.dto.request.PerfilRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.PerfilResponseDTO;
import com.inovatech.portal_instituto_caapora.service.PerfilService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Perfis de acesso (Coordenador, Atendente, Equipe de Campo...)
@RestController
@RequestMapping("/perfis")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;

    // POST /perfis   corpo: { "perfil": "Atendente" }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PerfilResponseDTO criar(@Valid @RequestBody PerfilRequestDTO dto) {
        return perfilService.criar(dto);
    }

    // GET /perfis
    @GetMapping
    public List<PerfilResponseDTO> listar() {
        return perfilService.listar();
    }

    // GET /perfis/1
    @GetMapping("/{id}")
    public PerfilResponseDTO buscarPorId(@PathVariable Long id) {
        return perfilService.buscarPorId(id);
    }
}
