package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;

// Card da equipe na tela "Equipes de Campo": dados da equipe e os três números
// (membros ativos, ocorrências em andamento e atendimentos concluídos)
public record EquipeResumoResponseDTO(
        Long id,
        String nome,
        String regiao,
        String telefone,
        EquipeStatus status,
        long membros,
        long emCampo,
        long concluidos
) {
}
