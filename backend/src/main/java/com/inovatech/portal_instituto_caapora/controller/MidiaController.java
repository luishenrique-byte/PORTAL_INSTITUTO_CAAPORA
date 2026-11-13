package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.dto.request.MidiaRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.MidiaResponseDTO;
import com.inovatech.portal_instituto_caapora.service.MidiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    // Upload público de foto ou vídeo, um arquivo por requisição (até 5 por ocorrência).
    // multipart/form-data com o campo "arquivo"
    // POST /ocorrencias/publica/CAA-260922-17852/midias
    @PostMapping(value = "/ocorrencias/publica/{protocolo}/midias", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MidiaResponseDTO enviarArquivo(@PathVariable String protocolo,
                                          @RequestPart("arquivo") MultipartFile arquivo) {
        return midiaService.enviarArquivoPublico(protocolo, arquivo);
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
