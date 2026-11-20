package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;

public record UsuarioLogadoResponseDTO(
        Long id,
        String nome,
        String email,
        String perfil,
        Long equipeId,
        String nomeEquipe
) {
    public static UsuarioLogadoResponseDTO fromEntity(FuncionarioEntity usuario) {
        if (usuario == null) return null;
        return new UsuarioLogadoResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil() != null ? usuario.getPerfil().getPerfil() : null,
                usuario.getEquipe() != null ? usuario.getEquipe().getId() : null,
                usuario.getEquipe() != null ? usuario.getEquipe().getNome() : null
        );
    }
}
