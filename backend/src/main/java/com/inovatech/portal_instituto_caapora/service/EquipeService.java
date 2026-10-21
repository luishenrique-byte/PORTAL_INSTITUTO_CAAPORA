package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;
import com.inovatech.portal_instituto_caapora.database.models.EquipeEntity;
import com.inovatech.portal_instituto_caapora.database.repository.EquipeRepository;
import com.inovatech.portal_instituto_caapora.dto.request.EquipeRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.EquipeResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RecursoNaoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Gestão das equipes de campo (US 7.4.2 e tela "Equipes de Campo")
@Service
@RequiredArgsConstructor
public class EquipeService {

    private final EquipeRepository equipeRepository;

    // Toda equipe nova começa DISPONIVEL (US 7.4.2, critério 1)
    @Transactional
    public EquipeResponseDTO criar(EquipeRequestDTO dto) {
        EquipeEntity equipe = EquipeEntity.builder()
                .nome(dto.nome())
                .status(EquipeStatus.DISPONIVEL)
                .build();
        return EquipeResponseDTO.fromEntity(equipeRepository.save(equipe));
    }

    @Transactional
    public EquipeResponseDTO renomear(Long id, EquipeRequestDTO dto) {
        EquipeEntity equipe = buscarEntidade(id);
        equipe.setNome(dto.nome());
        return EquipeResponseDTO.fromEntity(equipeRepository.save(equipe));
    }

    @Transactional(readOnly = true)
    public List<EquipeResponseDTO> listar() {
        return equipeRepository.findAll().stream().map(EquipeResponseDTO::fromEntity).toList();
    }

    // Só equipes disponíveis podem ser escolhidas para uma ocorrência (US 7.2.3, critério 2)
    @Transactional(readOnly = true)
    public List<EquipeResponseDTO> listarDisponiveis() {
        return equipeRepository.findByStatus(EquipeStatus.DISPONIVEL).stream()
                .map(EquipeResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public EquipeResponseDTO buscarPorId(Long id) {
        return EquipeResponseDTO.fromEntity(buscarEntidade(id));
    }

    EquipeEntity buscarEntidade(Long id) {
        return equipeRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Equipe não encontrada: " + id));
    }
}
