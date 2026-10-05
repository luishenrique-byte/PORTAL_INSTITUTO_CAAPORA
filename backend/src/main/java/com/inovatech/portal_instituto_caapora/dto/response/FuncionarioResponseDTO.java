package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;

public record FuncionarioResponseDTO(
        Long id,
        String nome,
        String email,
        PerfilResponseDTO perfil,
        EquipeResponseDTO equipe,
        Boolean ativo
) {
    public static FuncionarioResponseDTO fromEntity(FuncionarioEntity funcionario) {
        if (funcionario == null) return null;
        return new FuncionarioResponseDTO(
                funcionario.getId(),
                funcionario.getNome(),
                funcionario.getEmail(),
                PerfilResponseDTO.fromEntity(funcionario.getPerfil()),
                EquipeResponseDTO.fromEntity(funcionario.getEquipe()),
                funcionario.getAtivo()
        );
    }
}
