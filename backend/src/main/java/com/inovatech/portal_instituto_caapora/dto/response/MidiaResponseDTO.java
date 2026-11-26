package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.TipoMidia;
import com.inovatech.portal_instituto_caapora.database.models.MidiaEntity;

public record MidiaResponseDTO(
        Long id,
        String url,
        TipoMidia tipoMidia
) {
    public static MidiaResponseDTO fromEntity(MidiaEntity midia) {
        if (midia == null) return null;
        return new MidiaResponseDTO(midia.getId(), midia.getUrl(), midia.getTipoMidia());
    }
}
