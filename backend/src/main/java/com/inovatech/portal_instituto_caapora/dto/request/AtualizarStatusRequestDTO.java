package com.inovatech.portal_instituto_caapora.dto.request;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import jakarta.validation.constraints.NotNull;

// Usado quando um funcionário muda a etapa da ocorrência; gera uma linha no histórico
public record AtualizarStatusRequestDTO(
        @NotNull OcorrenciaStatus status,
        @NotNull Long responsavelId
) {
}
