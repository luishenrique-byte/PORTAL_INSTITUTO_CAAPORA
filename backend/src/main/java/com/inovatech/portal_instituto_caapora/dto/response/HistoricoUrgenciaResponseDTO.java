package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoUrgenciaEntity;

import java.time.LocalDateTime;

public record HistoricoUrgenciaResponseDTO(
        Long id,
        GrauUrgencia urgenciaAnterior,
        GrauUrgencia urgenciaNova,
        LocalDateTime dataHora,
        Long responsavelId,
        String responsavelNome
) {
    public static HistoricoUrgenciaResponseDTO fromEntity(HistoricoUrgenciaEntity historico) {
        if (historico == null) return null;
        FuncionarioEntity responsavel = historico.getResponsavel();
        return new HistoricoUrgenciaResponseDTO(
                historico.getId(),
                historico.getUrgenciaAnterior(),
                historico.getUrgenciaNova(),
                historico.getDataHora(),
                responsavel != null ? responsavel.getId() : null,
                responsavel != null ? responsavel.getNome() : null
        );
    }
}
