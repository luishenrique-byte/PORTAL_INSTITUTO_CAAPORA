package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.dto.request.MidiaRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.MidiaResponseDTO;
import com.inovatech.portal_instituto_caapora.service.MidiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Fotos e vídeos de uma ocorrência.
// O arquivo fica guardado fora do banco; aqui trafega só a url e o tipo.
@RestController
@RequiredArgsConstructor
public class MidiaController {

    private final MidiaService midiaService;

    // Corpo: { "url": "https://...", "tipoMidia": "FOTO" }
    // POST /ocorrencias/10/midias
    @PostMapping("/ocorrencias/{ocorrenciaId}/midias")
    @ResponseStatus(HttpStatus.CREATED)
    public MidiaResponseDTO adicionar(@PathVariable Long ocorrenciaId,
                                      @Valid @RequestBody MidiaRequestDTO dto) {
        return midiaService.adicionar(ocorrenciaId, dto);
    }

    // GET /ocorrencias/10/midias
    @GetMapping("/ocorrencias/{ocorrenciaId}/midias")
    public List<MidiaResponseDTO> listarPorOcorrencia(@PathVariable Long ocorrenciaId) {
        return midiaService.listarPorOcorrencia(ocorrenciaId);
    }

    // DELETE /midias/7
    @DeleteMapping("/midias/{midiaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long midiaId) {
        midiaService.remover(midiaId);
    }
}
