package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.PerfilEntity;
import com.inovatech.portal_instituto_caapora.database.repository.PerfilRepository;
import com.inovatech.portal_instituto_caapora.dto.request.PerfilRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.PerfilResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RecursoNaoEncontradoException;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Perfis de acesso dos funcionários (ex: Coordenador, Atendente, Equipe de Campo) — RF05
@Service
@RequiredArgsConstructor
public class PerfilService {

    private final PerfilRepository perfilRepository;

    @Transactional
    public PerfilResponseDTO criar(PerfilRequestDTO dto) {
        if (perfilRepository.findByPerfil(dto.perfil()).isPresent()) {
            throw new RegraNegocioException("Já existe um perfil com o nome " + dto.perfil());
        }
        return PerfilResponseDTO.fromEntity(perfilRepository.save(dto.toEntity()));
    }

    @Transactional(readOnly = true)
    public List<PerfilResponseDTO> listar() {
        return perfilRepository.findAll().stream().map(PerfilResponseDTO::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public PerfilResponseDTO buscarPorId(Long id) {
        return PerfilResponseDTO.fromEntity(buscarEntidade(id));
    }

    // Usado por outros services que precisam da entidade, não do DTO
    PerfilEntity buscarEntidade(Long id) {
        return perfilRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil não encontrado: " + id));
    }
}
