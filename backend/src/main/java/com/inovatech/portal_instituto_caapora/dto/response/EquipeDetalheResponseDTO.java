package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;

import java.util.List;

// Modal "Detalhes da Equipe" (Tela 12): dados da equipe, membros,
// resgates em andamento e os últimos atendimentos concluídos.
public record EquipeDetalheResponseDTO(
        Long id,
        String nome,
        EquipeStatus status,
        List<FuncionarioResponseDTO> membros,
        List<OcorrenciaResponseDTO> resgatesEmAndamento,
        List<OcorrenciaResponseDTO> historicoRecente
) {
}
