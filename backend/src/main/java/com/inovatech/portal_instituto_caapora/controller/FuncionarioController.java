package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.dto.request.FuncionarioRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.FuncionarioResponseDTO;
import com.inovatech.portal_instituto_caapora.service.FuncionarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Cadastro de funcionários
@RestController
@RequestMapping("/funcionarios")
@RequiredArgsConstructor
public class FuncionarioController {

    private final FuncionarioService funcionarioService;

    // POST /funcionarios
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FuncionarioResponseDTO criar(@Valid @RequestBody FuncionarioRequestDTO dto) {
        return funcionarioService.criar(dto);
    }

    // PUT /funcionarios/3
    @PutMapping("/{id}")
    public FuncionarioResponseDTO atualizar(@PathVariable Long id, @Valid @RequestBody FuncionarioRequestDTO dto) {
        return funcionarioService.atualizar(id, dto);
    }

    // Não apaga do banco: só desativa (o histórico do funcionário é mantido)
    // DELETE /funcionarios/3
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desativar(@PathVariable Long id) {
        funcionarioService.desativar(id);
    }

    // GET /funcionarios   (só os ativos)
    @GetMapping
    public List<FuncionarioResponseDTO> listarAtivos() {
        return funcionarioService.listarAtivos();
    }

    // GET /funcionarios/3
    @GetMapping("/{id}")
    public FuncionarioResponseDTO buscarPorId(@PathVariable Long id) {
        return funcionarioService.buscarPorId(id);
    }
}
