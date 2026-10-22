package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.dto.request.AtualizarStatusRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.request.OcorrenciaRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.HistoricoOcorrenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.HistoricoUrgenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.OcorrenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.RastreioOcorrenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.service.OcorrenciaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

// O controller só recebe a requisição, chama o service e devolve a resposta.
// Nenhuma regra de negócio fica aqui: isso é trabalho do OcorrenciaService.
@RestController
@RequestMapping("/ocorrencias")
@RequiredArgsConstructor
public class OcorrenciaController {

    private final OcorrenciaService ocorrenciaService;

    // ---------------- Registro ----------------

    // Formulário público (cidadão, sem login)
    // POST /ocorrencias/publica
    @PostMapping("/publica")
    @ResponseStatus(HttpStatus.CREATED)
    public OcorrenciaResponseDTO registrarPublica(@Valid @RequestBody OcorrenciaRequestDTO dto) {
        return ocorrenciaService.registrarPublica(dto);
    }

    // Cadastro manual feito por um atendente (telefone/WhatsApp)
    // POST /ocorrencias/manual?funcionarioId=1
    @PostMapping("/manual")
    @ResponseStatus(HttpStatus.CREATED)
    public OcorrenciaResponseDTO registrarManual(@Valid @RequestBody OcorrenciaRequestDTO dto,
                                                 @RequestParam Long funcionarioId) {
        return ocorrenciaService.registrarManual(dto, funcionarioId);
    }

    // ---------------- Consultas ----------------

    // Fila de ocorrências não concluídas (mais urgentes primeiro)
    // GET /ocorrencias
    @GetMapping
    public List<OcorrenciaResponseDTO> listarAtivas() {
        return ocorrenciaService.listarAtivas();
    }

    // GET /ocorrencias/10
    @GetMapping("/{id}")
    public OcorrenciaResponseDTO buscarPorId(@PathVariable Long id) {
        return ocorrenciaService.buscarPorId(id);
    }

    // Todos os parâmetros são opcionais. Exemplo:
    // GET /ocorrencias/filtro?status=TRIAGEM&urgencia=ALTA&equipeId=2&inicio=2026-10-01T00:00:00
    @GetMapping("/filtro")
    public List<OcorrenciaResponseDTO> filtrar(
            @RequestParam(required = false) OcorrenciaStatus status,
            @RequestParam(required = false) GrauUrgencia urgencia,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        return ocorrenciaService.filtrar(status, urgencia, equipeId, inicio, fim);
    }

    // Linha do tempo (mudanças de status) - uso interno
    // GET /ocorrencias/10/historico
    @GetMapping("/{id}/historico")
    public List<HistoricoOcorrenciaResponseDTO> listarHistorico(@PathVariable Long id) {
        return ocorrenciaService.listarHistorico(id);
    }

    // Auditoria das mudanças de urgência
    // GET /ocorrencias/10/historico-urgencia
    @GetMapping("/{id}/historico-urgencia")
    public List<HistoricoUrgenciaResponseDTO> listarHistoricoUrgencia(@PathVariable Long id) {
        return ocorrenciaService.listarHistoricoUrgencia(id);
    }

    // Consulta pública pelo número do protocolo (o cidadão acompanha o caso)
    // GET /ocorrencias/rastreio/CAA-261022-12345
    @GetMapping("/rastreio/{protocolo}")
    public RastreioOcorrenciaResponseDTO rastrear(@PathVariable String protocolo) {
        return ocorrenciaService.rastrearPorProtocolo(protocolo);
    }

    // ---------------- Ações da central / equipe ----------------

    // Corpo: { "status": "TRIAGEM", "responsavelId": 1 }
    // PATCH /ocorrencias/10/status
    @PatchMapping("/{id}/status")
    public OcorrenciaResponseDTO atualizarStatus(@PathVariable Long id,
                                                 @Valid @RequestBody AtualizarStatusRequestDTO dto) {
        return ocorrenciaService.atualizarStatus(id, dto);
    }

    // PATCH /ocorrencias/10/urgencia?urgencia=CRITICA&funcionarioId=1
    @PatchMapping("/{id}/urgencia")
    public OcorrenciaResponseDTO alterarUrgencia(@PathVariable Long id,
                                                 @RequestParam GrauUrgencia urgencia,
                                                 @RequestParam Long funcionarioId) {
        return ocorrenciaService.alterarUrgencia(id, urgencia, funcionarioId);
    }

    // PATCH /ocorrencias/10/equipe?equipeId=5&funcionarioId=1
    @PatchMapping("/{id}/equipe")
    public OcorrenciaResponseDTO atribuirEquipe(@PathVariable Long id,
                                                @RequestParam Long equipeId,
                                                @RequestParam Long funcionarioId) {
        return ocorrenciaService.atribuirEquipe(id, equipeId, funcionarioId);
    }
}
