package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.TipoMidia;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// Fotos, vídeos e áudios anexados a uma ocorrência (RF01, US 7.1.2 critério 2).
// Uma ocorrência pode ter vários anexos.
@Service
@RequiredArgsConstructor
public class MidiaService {

    private final MidiaRepository midiaRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final ArmazenamentoArquivoService armazenamento;

    // Limite de anexos por ocorrência no formulário público (Figma: "até 5 arquivos")
    public static final int MAX_MIDIAS_PUBLICAS = 5;

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

    // Upload de foto/vídeo pelo formulário público.
    // Usa o protocolo (não o id sequencial) e só aceita enquanto a ocorrência
    // ainda está REGISTRADA, ou seja, logo após o envio e antes da triagem.
    @Transactional
    public MidiaResponseDTO enviarArquivoPublico(String protocolo, MultipartFile arquivo) {
        OcorrenciaEntity ocorrencia = ocorrenciaRepository.findByProtocolo(protocolo)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Protocolo não encontrado: " + protocolo));
        if (ocorrencia.getOcorrenciaStatus() != OcorrenciaStatus.REGISTRADA) {
            throw new RegraNegocioException("Ocorrência " + protocolo + " já está em atendimento e não aceita novos anexos");
        }
        if (midiaRepository.countByOcorrenciaId(ocorrencia.getId()) >= MAX_MIDIAS_PUBLICAS) {
            throw new RegraNegocioException("Limite de " + MAX_MIDIAS_PUBLICAS + " arquivos por ocorrência atingido");
        }
        TipoMidia tipo = armazenamento.identificarTipo(arquivo);
        String url = armazenamento.salvar(arquivo);
        try {
            MidiaEntity midia = MidiaEntity.builder()
                    .url(url)
                    .tipoMidia(tipo)
                    .ocorrencia(ocorrencia)
                    .build();
            return MidiaResponseDTO.fromEntity(midiaRepository.save(midia));
        } catch (RuntimeException e) {
            armazenamento.apagar(url); // não deixa arquivo órfão se o banco falhar
            throw e;
        }
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
        armazenamento.apagar(midia.getUrl());
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
