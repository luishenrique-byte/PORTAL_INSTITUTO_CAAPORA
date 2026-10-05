package com.inovatech.portal_instituto_caapora.dto.request;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OrigemRegistro;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

// Dados enviados pelo formulário público ou pelo cadastro manual do atendente.
// protocolo, dataHoraRegistro e status são preenchidos pelo service, não pelo cliente.
public record OcorrenciaRequestDTO(
        Double latitude,
        Double longitude,
        String endereco,
        String pontoReferencia,
        String descricao,
        GrauUrgencia grauUrgencia,
        @NotNull OrigemRegistro origemRegistro,
        @Valid ReportanteRequestDTO reportante,
        @NotNull @Valid AnimalRequestDTO animal
) {
}
