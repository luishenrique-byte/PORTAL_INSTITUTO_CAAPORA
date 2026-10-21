package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.AnimalEntity;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OrigemRegistro;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.SaudeStatus;
import com.inovatech.portal_instituto_caapora.database.models.EquipeEntity;
import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoUrgenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.ReportanteEntity;
import com.inovatech.portal_instituto_caapora.database.repository.AnimalRepository;
import com.inovatech.portal_instituto_caapora.database.repository.EquipeRepository;
import com.inovatech.portal_instituto_caapora.database.repository.HistoricoOcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.HistoricoUrgenciaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.ReportanteRepository;
import com.inovatech.portal_instituto_caapora.dto.request.AtualizarStatusRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.request.OcorrenciaRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.HistoricoOcorrenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.HistoricoUrgenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.OcorrenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.RastreioOcorrenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RecursoNaoEncontradoException;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import com.inovatech.portal_instituto_caapora.utils.GeradorProtocolo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

// Regras de negócio do ciclo de vida da ocorrência: registro, triagem,
// atribuição de equipe, mudança de status e rastreio público.
@Service
@RequiredArgsConstructor
public class OcorrenciaService {

    // Quantas vezes tentamos gerar um protocolo que ainda não exista no banco
    private static final int TENTATIVAS_PROTOCOLO = 10;

    // Fila de triagem: mais urgente primeiro; empate -> quem espera há mais tempo primeiro (US 7.2.2)
    private static final Comparator<OcorrenciaEntity> ORDEM_FILA = Comparator
            .comparing(OcorrenciaEntity::getGrauUrgencia,
                    Comparator.nullsLast(Comparator.<GrauUrgencia>reverseOrder()))
            .thenComparing(OcorrenciaEntity::getDataHoraRegistro);

    private final OcorrenciaRepository ocorrenciaRepository;
    private final HistoricoOcorrenciaRepository historicoRepository;
    private final HistoricoUrgenciaRepository historicoUrgenciaRepository;
    private final AnimalRepository animalRepository;
    private final ReportanteRepository reportanteRepository;
    private final EquipeRepository equipeRepository;
    private final FuncionarioService funcionarioService;
    private final EquipeService equipeService;
    private final GeradorProtocolo geradorProtocolo;

    // ------------------------------------------------------------------
    // Registro
    // ------------------------------------------------------------------

    // Formulário público, sem login (RF01, RN-01). A origem é sempre APP_PUBLICO,
    // independente do que vier no DTO, e o histórico inicial fica sem responsável.
    @Transactional
    public OcorrenciaResponseDTO registrarPublica(OcorrenciaRequestDTO dto) {
        return registrar(dto, OrigemRegistro.APP_PUBLICO, null);
    }

    // Cadastro manual pelo atendente, para chamados de telefone/WhatsApp (RF03, RF09).
    // Aqui a urgência é obrigatória, pois quem registra já fez a triagem (US 7.2.1).
    @Transactional
    public OcorrenciaResponseDTO registrarManual(OcorrenciaRequestDTO dto, Long funcionarioId) {
        if (dto.grauUrgencia() == null) {
            throw new RegraNegocioException("O grau de urgência é obrigatório no cadastro manual");
        }
        FuncionarioEntity atendente = funcionarioService.buscarAtivo(funcionarioId);
        return registrar(dto, OrigemRegistro.CADASTRO_MANUAL, atendente);
    }

    private OcorrenciaResponseDTO registrar(OcorrenciaRequestDTO dto, OrigemRegistro origem,
                                            FuncionarioEntity responsavel) {
        validarLocalizacao(dto);

        AnimalEntity animal = animalRepository.save(dto.animal().toEntity());
        ReportanteEntity reportante = dto.reportante() != null
                ? reportanteRepository.save(dto.reportante().toEntity())
                : null;

        GrauUrgencia urgencia = dto.grauUrgencia() != null
                ? dto.grauUrgencia()
                : calcularUrgencia(animal.getSaudeStatus());

        OcorrenciaEntity ocorrencia = OcorrenciaEntity.builder()
                .protocolo(gerarProtocoloUnico())
                .dataHoraRegistro(LocalDateTime.now())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .endereco(dto.endereco())
                .pontoReferencia(dto.pontoReferencia())
                .descricao(dto.descricao())
                .grauUrgencia(urgencia)
                .origemRegistro(origem)
                .ocorrenciaStatus(OcorrenciaStatus.REGISTRADA)
                .reportante(reportante)
                .animal(animal)
                .build();
        ocorrencia = ocorrenciaRepository.save(ocorrencia);

        // Primeira linha da linha do tempo
        registrarHistorico(ocorrencia, OcorrenciaStatus.REGISTRADA, responsavel);

        return OcorrenciaResponseDTO.fromEntity(ocorrencia);
    }

    // RF02: precisa de coordenadas do GPS OU de um endereço digitado
    private void validarLocalizacao(OcorrenciaRequestDTO dto) {
        boolean temGps = dto.latitude() != null && dto.longitude() != null;
        boolean temEndereco = dto.endereco() != null && !dto.endereco().isBlank();
        if (!temGps && !temEndereco) {
            throw new RegraNegocioException("Informe a localização pelo GPS ou pelo endereço");
        }
    }

    // Urgência sugerida a partir do estado de saúde marcado pelo cidadão.
    // A central pode corrigir depois com alterarUrgencia (RF10).
    GrauUrgencia calcularUrgencia(SaudeStatus saude) {
        if (saude == null) {
            return GrauUrgencia.MEDIA;
        }
        return switch (saude) {
            case FERIDO, PRESO -> GrauUrgencia.ALTA;
            case DOENTE, ORFAO, INDEFINIDO -> GrauUrgencia.MEDIA;
            case OBITO -> GrauUrgencia.BAIXA;
        };
    }

    // Cada ocorrência precisa de um protocolo único (US 7.2.1, critério 2)
    private String gerarProtocoloUnico() {
        for (int i = 0; i < TENTATIVAS_PROTOCOLO; i++) {
            String protocolo = geradorProtocolo.gerar();
            if (!ocorrenciaRepository.existsByProtocolo(protocolo)) {
                return protocolo;
            }
        }
        throw new IllegalStateException("Não foi possível gerar um protocolo único");
    }

    // ------------------------------------------------------------------
    // Consultas
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public OcorrenciaResponseDTO buscarPorId(Long id) {
        return OcorrenciaResponseDTO.fromEntity(buscarEntidade(id));
    }

    // Painel/fila: todas as ocorrências não concluídas, mais urgentes no topo (US 7.2.2, US 7.4.1)
    @Transactional(readOnly = true)
    public List<OcorrenciaResponseDTO> listarAtivas() {
        return ocorrenciaRepository
                .findByOcorrenciaStatusNotOrderByDataHoraRegistroDesc(OcorrenciaStatus.CONCLUIDO)
                .stream()
                .sorted(ORDEM_FILA)
                .map(OcorrenciaResponseDTO::fromEntity)
                .toList();
    }

    // Filtros do painel e dos relatórios (US 7.4.4, RF15). Parâmetro null = sem filtro.
    @Transactional(readOnly = true)
    public List<OcorrenciaResponseDTO> filtrar(OcorrenciaStatus status, GrauUrgencia urgencia, Long equipeId,
                                               LocalDateTime inicio, LocalDateTime fim) {
        return ocorrenciaRepository.findAll().stream()
                .filter(o -> status == null || o.getOcorrenciaStatus() == status)
                .filter(o -> urgencia == null || o.getGrauUrgencia() == urgencia)
                .filter(o -> equipeId == null
                        || (o.getEquipe() != null && equipeId.equals(o.getEquipe().getId())))
                .filter(o -> inicio == null || !o.getDataHoraRegistro().isBefore(inicio))
                .filter(o -> fim == null || !o.getDataHoraRegistro().isAfter(fim))
                .sorted(ORDEM_FILA)
                .map(OcorrenciaResponseDTO::fromEntity)
                .toList();
    }

    // Linha do tempo completa, com responsável, para o módulo interno (US 7.4.4)
    @Transactional(readOnly = true)
    public List<HistoricoOcorrenciaResponseDTO> listarHistorico(Long ocorrenciaId) {
        buscarEntidade(ocorrenciaId);
        return historicoRepository.findByOcorrenciaIdOrderByDataHoraAsc(ocorrenciaId).stream()
                .map(HistoricoOcorrenciaResponseDTO::fromEntity)
                .toList();
    }

    // Consulta pública por protocolo; não expõe dados pessoais (RF04, US 7.1.4, LGPD)
    @Transactional(readOnly = true)
    public RastreioOcorrenciaResponseDTO rastrearPorProtocolo(String protocolo) {
        OcorrenciaEntity ocorrencia = ocorrenciaRepository.findByProtocolo(protocolo)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Protocolo não encontrado: " + protocolo));
        List<HistoricoOcorrenciaEntity> historico =
                historicoRepository.findByOcorrenciaIdOrderByDataHoraAsc(ocorrencia.getId());
        return RastreioOcorrenciaResponseDTO.fromEntity(ocorrencia, historico);
    }

    // ------------------------------------------------------------------
    // Ações da central e da equipe de campo
    // ------------------------------------------------------------------

    // Avança a ocorrência para a próxima etapa e grava no histórico (RF12, US 7.3.2)
    @Transactional
    public OcorrenciaResponseDTO atualizarStatus(Long ocorrenciaId, AtualizarStatusRequestDTO dto) {
        OcorrenciaEntity ocorrencia = buscarEntidade(ocorrenciaId);
        garantirNaoConcluida(ocorrencia);
        FuncionarioEntity responsavel = funcionarioService.buscarAtivo(dto.responsavelId());

        OcorrenciaStatus atual = ocorrencia.getOcorrenciaStatus();
        OcorrenciaStatus novo = dto.status();
        // A linha do tempo só anda para frente (Registrada -> Triagem -> ... -> Concluído)
        if (novo.ordinal() <= atual.ordinal()) {
            throw new RegraNegocioException("Não é possível mudar o status de " + atual + " para " + novo);
        }
        if (novo == OcorrenciaStatus.RESGATE && ocorrencia.getEquipe() == null) {
            throw new RegraNegocioException("Atribua uma equipe antes de iniciar o resgate");
        }

        ocorrencia.setOcorrenciaStatus(novo);
        // Ao concluir, a equipe volta a ficar livre para novos chamados
        if (novo == OcorrenciaStatus.CONCLUIDO && ocorrencia.getEquipe() != null) {
            liberarEquipe(ocorrencia.getEquipe());
        }
        ocorrencia = ocorrenciaRepository.save(ocorrencia);
        registrarHistorico(ocorrencia, novo, responsavel);

        return OcorrenciaResponseDTO.fromEntity(ocorrencia);
    }

    // A central reclassifica o nível de risco (RF10, US 7.2.2).
    // Toda alteração fica registrada com data, hora e responsável (US 7.2.2, critério 2).
    @Transactional
    public OcorrenciaResponseDTO alterarUrgencia(Long ocorrenciaId, GrauUrgencia urgencia, Long funcionarioId) {
        if (urgencia == null) {
            throw new RegraNegocioException("Informe o novo grau de urgência");
        }
        OcorrenciaEntity ocorrencia = buscarEntidade(ocorrenciaId);
        garantirNaoConcluida(ocorrencia);
        FuncionarioEntity responsavel = funcionarioService.buscarAtivo(funcionarioId);

        GrauUrgencia anterior = ocorrencia.getGrauUrgencia();
        if (anterior == urgencia) {
            return OcorrenciaResponseDTO.fromEntity(ocorrencia);
        }
        ocorrencia.setGrauUrgencia(urgencia);
        ocorrencia = ocorrenciaRepository.save(ocorrencia);

        historicoUrgenciaRepository.save(HistoricoUrgenciaEntity.builder()
                .ocorrencia(ocorrencia)
                .responsavel(responsavel)
                .urgenciaAnterior(anterior)
                .urgenciaNova(urgencia)
                .dataHora(LocalDateTime.now())
                .build());

        return OcorrenciaResponseDTO.fromEntity(ocorrencia);
    }

    // Auditoria das reclassificações de urgência, em ordem cronológica (US 7.2.2, US 7.4.4)
    @Transactional(readOnly = true)
    public List<HistoricoUrgenciaResponseDTO> listarHistoricoUrgencia(Long ocorrenciaId) {
        buscarEntidade(ocorrenciaId);
        return historicoUrgenciaRepository.findByOcorrenciaIdOrderByDataHoraAsc(ocorrenciaId).stream()
                .map(HistoricoUrgenciaResponseDTO::fromEntity)
                .toList();
    }

    // Vincula ou troca a equipe responsável (RF13, US 7.2.3).
    // Tudo acontece numa única transação, então a ocorrência nunca fica sem equipe no meio da troca.
    @Transactional
    public OcorrenciaResponseDTO atribuirEquipe(Long ocorrenciaId, Long equipeId, Long funcionarioId) {
        OcorrenciaEntity ocorrencia = buscarEntidade(ocorrenciaId);
        garantirNaoConcluida(ocorrencia);
        funcionarioService.buscarAtivo(funcionarioId);

        EquipeEntity nova = equipeService.buscarEntidade(equipeId);
        EquipeEntity anterior = ocorrencia.getEquipe();
        if (anterior != null && anterior.getId().equals(nova.getId())) {
            return OcorrenciaResponseDTO.fromEntity(ocorrencia);
        }
        // Só equipes disponíveis podem ser escolhidas (US 7.2.3, critério 2)
        if (nova.getStatus() != EquipeStatus.DISPONIVEL) {
            throw new RegraNegocioException("A equipe " + nova.getNome() + " está ocupada");
        }

        if (anterior != null) {
            liberarEquipe(anterior);
        }
        nova.setStatus(EquipeStatus.OCUPADO);
        equipeRepository.save(nova);
        ocorrencia.setEquipe(nova);

        return OcorrenciaResponseDTO.fromEntity(ocorrenciaRepository.save(ocorrencia));
    }

    // ------------------------------------------------------------------
    // Auxiliares
    // ------------------------------------------------------------------

    private OcorrenciaEntity buscarEntidade(Long id) {
        return ocorrenciaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Ocorrência não encontrada: " + id));
    }

    // Ocorrência concluída não pode mais ser alterada (RN-04)
    private void garantirNaoConcluida(OcorrenciaEntity ocorrencia) {
        if (ocorrencia.getOcorrenciaStatus() == OcorrenciaStatus.CONCLUIDO) {
            throw new RegraNegocioException("Ocorrência " + ocorrencia.getProtocolo() + " já foi concluída");
        }
    }

    private void liberarEquipe(EquipeEntity equipe) {
        equipe.setStatus(EquipeStatus.DISPONIVEL);
        equipeRepository.save(equipe);
    }

    private void registrarHistorico(OcorrenciaEntity ocorrencia, OcorrenciaStatus status,
                                    FuncionarioEntity responsavel) {
        historicoRepository.save(HistoricoOcorrenciaEntity.builder()
                .ocorrencia(ocorrencia)
                .responsavel(responsavel)
                .statusMovimentacao(status)
                .dataHora(LocalDateTime.now())
                .build());
    }
}
