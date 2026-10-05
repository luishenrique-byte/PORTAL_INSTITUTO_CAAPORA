package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;

import java.time.LocalDateTime;
import java.util.List;

// Visão pública da consulta por protocolo (RF04).
// Não expõe dados do comunicante nem nomes de funcionários (LGPD).
public record RastreioOcorrenciaResponseDTO(
        String protocolo,
        LocalDateTime dataHoraRegistro,
        OcorrenciaStatus ocorrenciaStatus,
        List<Etapa> linhaDoTempo
) {
    public record Etapa(OcorrenciaStatus status, LocalDateTime dataHora) {
    }

    public static RastreioOcorrenciaResponseDTO fromEntity(OcorrenciaEntity ocorrencia,
                                                           List<HistoricoOcorrenciaEntity> historico) {
        List<Etapa> etapas = historico.stream()
                .map(h -> new Etapa(h.getStatusMovimentacao(), h.getDataHora()))
                .toList();
        return new RastreioOcorrenciaResponseDTO(
                ocorrencia.getProtocolo(),
                ocorrencia.getDataHoraRegistro(),
                ocorrencia.getOcorrenciaStatus(),
                etapas
        );
    }
}
