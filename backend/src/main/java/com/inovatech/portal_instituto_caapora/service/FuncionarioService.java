package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.database.repository.FuncionarioRepository;
import com.inovatech.portal_instituto_caapora.dto.request.FuncionarioRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.FuncionarioResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RecursoNaoEncontradoException;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Cadastro, edição e desativação de funcionários (US 7.4.2)
@Service
@RequiredArgsConstructor
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final PerfilService perfilService;
    private final EquipeService equipeService;

    @Transactional
    public FuncionarioResponseDTO criar(FuncionarioRequestDTO dto) {
        if (funcionarioRepository.existsByEmail(dto.email())) {
            throw new RegraNegocioException("Já existe um funcionário com o e-mail " + dto.email());
        }
        FuncionarioEntity funcionario = FuncionarioEntity.builder()
                .nome(dto.nome())
                .email(dto.email())
                .perfil(perfilService.buscarEntidade(dto.perfilId()))
                .equipe(dto.equipeId() != null ? equipeService.buscarEntidade(dto.equipeId()) : null)
                .ativo(true)
                .build();
        return FuncionarioResponseDTO.fromEntity(funcionarioRepository.save(funcionario));
    }

    @Transactional
    public FuncionarioResponseDTO atualizar(Long id, FuncionarioRequestDTO dto) {
        FuncionarioEntity funcionario = buscarEntidade(id);
        boolean trocouEmail = !funcionario.getEmail().equalsIgnoreCase(dto.email());
        if (trocouEmail && funcionarioRepository.existsByEmail(dto.email())) {
            throw new RegraNegocioException("Já existe um funcionário com o e-mail " + dto.email());
        }
        funcionario.setNome(dto.nome());
        funcionario.setEmail(dto.email());
        funcionario.setPerfil(perfilService.buscarEntidade(dto.perfilId()));
        funcionario.setEquipe(dto.equipeId() != null ? equipeService.buscarEntidade(dto.equipeId()) : null);
        return FuncionarioResponseDTO.fromEntity(funcionarioRepository.save(funcionario));
    }

    // Exclusão lógica: o funcionário perde o acesso, mas o histórico
    // de ações dele é preservado (US 7.4.2, cenário 2)
    @Transactional
    public void desativar(Long id) {
        FuncionarioEntity funcionario = buscarEntidade(id);
        funcionario.setAtivo(false);
        funcionarioRepository.save(funcionario);
    }

    @Transactional(readOnly = true)
    public List<FuncionarioResponseDTO> listarAtivos() {
        return funcionarioRepository.findByAtivoTrue().stream()
                .map(FuncionarioResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public FuncionarioResponseDTO buscarPorId(Long id) {
        return FuncionarioResponseDTO.fromEntity(buscarEntidade(id));
    }

    FuncionarioEntity buscarEntidade(Long id) {
        return funcionarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Funcionário não encontrado: " + id));
    }

    // Só funcionários ativos podem agir sobre ocorrências
    FuncionarioEntity buscarAtivo(Long id) {
        FuncionarioEntity funcionario = buscarEntidade(id);
        if (!Boolean.TRUE.equals(funcionario.getAtivo())) {
            throw new RegraNegocioException("Funcionário desativado não pode realizar esta ação: " + id);
        }
        return funcionario;
    }
}
