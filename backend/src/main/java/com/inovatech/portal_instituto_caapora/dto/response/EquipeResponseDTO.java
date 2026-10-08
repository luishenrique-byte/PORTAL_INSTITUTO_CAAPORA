package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;
import com.inovatech.portal_instituto_caapora.database.models.EquipeEntity;

public record EquipeResponseDTO(
        Long id,
        String nome,
        EquipeStatus status
) {
    public static EquipeResponseDTO fromEntity(EquipeEntity equipe) {
        if (equipe == null) return null;
        return new EquipeResponseDTO(
                equipe.getId(),
                equipe.getNome(),
                equipe.getStatus()
        );
    }
}
