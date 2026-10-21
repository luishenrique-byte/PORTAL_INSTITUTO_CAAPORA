package com.inovatech.portal_instituto_caapora.dto.response;

import java.time.LocalDateTime;
import java.util.List;

// Relatório gerencial de um período (US 7.4.3, RF15).
// Os tempos médios ficam null quando não há ocorrência que permita calculá-los.
public record RelatorioResponseDTO(
        LocalDateTime inicio,
        LocalDateTime fim,
        long totalOcorrencias,
        long concluidas,
        double taxaConclusao,
        Double tempoMedioRespostaMinutos,
        Double tempoMedioConclusaoMinutos,
        List<ContagemResponseDTO> porStatus,
        List<ContagemResponseDTO> porGrauUrgencia,
        List<ContagemResponseDTO> porCategoriaAnimal,
        List<ContagemResponseDTO> porEquipe
) {
}
