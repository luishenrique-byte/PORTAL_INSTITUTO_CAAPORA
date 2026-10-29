package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.MidiaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.repository.MidiaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.dto.request.MidiaRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.MidiaResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RecursoNaoEncontradoException;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Fotos, vídeos e áudios anexados a uma ocorrência (RF01, US 7.1.2 critério 2).
// Uma ocorrência pode ter vários anexos.
@Service
@RequiredArgsConstructor
public class MidiaService {

    private final MidiaRepository midiaRepository;
    private final OcorrenciaRepository ocorrenciaRepository;

    @Transactional
    public MidiaResponseDTO adicionar(Long ocorrenciaId, MidiaRequestDTO dto) {
        OcorrenciaEntity ocorrencia = buscarOcorrencia(ocorrenciaId);
        garantirNaoConcluida(ocorrencia);
        MidiaEntity midia = MidiaEntity.builder()
                .url(dto.url())
                .tipoMidia(dto.tipoMidia())
                .ocorrencia(ocorrencia)
                .build();
        return MidiaResponseDTO.fromEntity(midiaRepository.save(midia));
    }

    @Transactional(readOnly = true)
    public List<MidiaResponseDTO> listarPorOcorrencia(Long ocorrenciaId) {
        buscarOcorrencia(ocorrenciaId);
        return midiaRepository.findByOcorrenciaId(ocorrenciaId).stream()
                .map(MidiaResponseDTO::fromEntity)
                .toList();
    }

    // Permite tirar um anexo enviado por engano, mas só enquanto a ocorrência
    // estiver em andamento: depois de concluída, nada é apagado (RN-04)
    @Transactional
    public void remover(Long midiaId) {
        MidiaEntity midia = midiaRepository.findById(midiaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Mídia não encontrada: " + midiaId));
        garantirNaoConcluida(midia.getOcorrencia());
        midiaRepository.delete(midia);
    }

    private OcorrenciaEntity buscarOcorrencia(Long id) {
        return ocorrenciaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Ocorrência não encontrada: " + id));
    }

    private void garantirNaoConcluida(OcorrenciaEntity ocorrencia) {
        if (ocorrencia.getOcorrenciaStatus() == OcorrenciaStatus.CONCLUIDO) {
            throw new RegraNegocioException("Ocorrência " + ocorrencia.getProtocolo() + " já foi concluída");
        }
    }
}
