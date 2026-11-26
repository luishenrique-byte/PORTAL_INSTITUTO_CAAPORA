package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;

// Um ponto no mapa de calor (Tela 9/10). O front-end junta os pontos próximos
// e pinta as áreas com mais ocorrências.
public record PontoMapaResponseDTO(
        Double latitude,
        Double longitude,
        GrauUrgencia grauUrgencia
) {
}
