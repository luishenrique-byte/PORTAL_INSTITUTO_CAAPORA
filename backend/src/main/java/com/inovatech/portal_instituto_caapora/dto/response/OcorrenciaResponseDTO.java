package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OrigemRegistro;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;

import java.time.LocalDateTime;
import java.util.List;

// Visão completa da ocorrência, usada no módulo interno (funcionários)
public record OcorrenciaResponseDTO(
        Long id,
        String protocolo,
        LocalDateTime dataHoraRegistro,
        Double latitude,
        Double longitude,
        String endereco,
        String pontoReferencia,
        String descricao,
        GrauUrgencia grauUrgencia,
        OrigemRegistro origemRegistro,
        OcorrenciaStatus ocorrenciaStatus,
        ReportanteResponseDTO reportante,
        AnimalResponseDTO animal,
        EquipeResponseDTO equipe,
        List<MidiaResponseDTO> midias
) {
    public static OcorrenciaResponseDTO fromEntity(OcorrenciaEntity ocorrencia) {
        if (ocorrencia == null) return null;
        List<MidiaResponseDTO> midias = ocorrencia.getMidias() == null
                ? List.of()
                : ocorrencia.getMidias().stream().map(MidiaResponseDTO::fromEntity).toList();
        return new OcorrenciaResponseDTO(
                ocorrencia.getId(),
                ocorrencia.getProtocolo(),
                ocorrencia.getDataHoraRegistro(),
                ocorrencia.getLatitude(),
                ocorrencia.getLongitude(),
                ocorrencia.getEndereco(),
                ocorrencia.getPontoReferencia(),
                ocorrencia.getDescricao(),
                ocorrencia.getGrauUrgencia(),
                ocorrencia.getOrigemRegistro(),
                ocorrencia.getOcorrenciaStatus(),
                ReportanteResponseDTO.fromEntity(ocorrencia.getReportante()),
                AnimalResponseDTO.fromEntity(ocorrencia.getAnimal()),
                EquipeResponseDTO.fromEntity(ocorrencia.getEquipe()),
                midias
        );
    }
}
