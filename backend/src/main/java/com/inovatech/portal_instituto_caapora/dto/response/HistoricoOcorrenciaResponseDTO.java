package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;

import java.time.LocalDateTime;

public record HistoricoOcorrenciaResponseDTO(
        Long id,
        OcorrenciaStatus statusMovimentacao,
        LocalDateTime dataHora,
        Long responsavelId,
        String responsavelNome
) {
    public static HistoricoOcorrenciaResponseDTO fromEntity(HistoricoOcorrenciaEntity historico) {
        if (historico == null) return null;
        // responsavel é null quando a ocorrência foi registrada por um cidadão no portal público
        FuncionarioEntity responsavel = historico.getResponsavel();
        return new HistoricoOcorrenciaResponseDTO(
                historico.getId(),
                historico.getStatusMovimentacao(),
                historico.getDataHora(),
                responsavel != null ? responsavel.getId() : null,
                responsavel != null ? responsavel.getNome() : null
        );
    }
}
