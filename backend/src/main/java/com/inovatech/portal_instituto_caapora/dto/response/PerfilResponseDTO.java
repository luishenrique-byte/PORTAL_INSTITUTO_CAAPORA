package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.PerfilEntity;

public record PerfilResponseDTO(
        Long id,
        String perfil
) {
    public static PerfilResponseDTO fromEntity(PerfilEntity perfil) {
        if (perfil == null) return null;
        return new PerfilResponseDTO(perfil.getId(), perfil.getPerfil());
    }
}
