package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OrigemRegistro;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.SaudeStatus;
import com.inovatech.portal_instituto_caapora.database.models.EquipeEntity;
import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.repository.AnimalRepository;
import com.inovatech.portal_instituto_caapora.database.repository.EquipeRepository;
import com.inovatech.portal_instituto_caapora.database.repository.HistoricoOcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.ReportanteRepository;
import com.inovatech.portal_instituto_caapora.dto.request.AnimalRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.request.AtualizarStatusRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.request.OcorrenciaRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.request.ReportanteRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.OcorrenciaResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import com.inovatech.portal_instituto_caapora.utils.GeradorProtocolo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Testes unitários: os repositórios são "falsificados" (mocks), então não precisa de banco.
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OcorrenciaServiceTest {

    @Mock OcorrenciaRepository ocorrenciaRepository;
    @Mock HistoricoOcorrenciaRepository historicoRepository;
    @Mock AnimalRepository animalRepository;
    @Mock ReportanteRepository reportanteRepository;
    @Mock EquipeRepository equipeRepository;
    @Mock FuncionarioService funcionarioService;
    @Mock EquipeService equipeService;
    @Mock GeradorProtocolo geradorProtocolo;

    @InjectMocks OcorrenciaService service;

    private final FuncionarioEntity atendente = FuncionarioEntity.builder().id(1L).nome("Ana").ativo(true).build();

    @BeforeEach
    void setUp() {
        // save() devolve o próprio objeto recebido, como o banco faria
        when(animalRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(reportanteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ocorrenciaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(equipeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(geradorProtocolo.gerar()).thenReturn("CAA-261012-00001");
        when(funcionarioService.buscarAtivo(1L)).thenReturn(atendente);
    }

    private OcorrenciaRequestDTO dto(GrauUrgencia urgencia, String endereco, ReportanteRequestDTO reportante) {
        return new OcorrenciaRequestDTO(null, null, endereco, "Perto da praça", "Ave caída",
                urgencia, OrigemRegistro.CADASTRO_MANUAL, reportante,
                new AnimalRequestDTO("Carcará", CategoriaAnimal.AVE, SaudeStatus.FERIDO));
    }

    @Test
    void registroPublicoForcaOrigemAppPublicoECalculaUrgencia() {
        OcorrenciaResponseDTO resposta = service.registrarPublica(dto(null, "Rua A", null));

        assertEquals(OrigemRegistro.APP_PUBLICO, resposta.origemRegistro());
        assertEquals(OcorrenciaStatus.REGISTRADA, resposta.ocorrenciaStatus());
        assertEquals(GrauUrgencia.ALTA, resposta.grauUrgencia()); // FERIDO -> ALTA
        assertEquals("CAA-261012-00001", resposta.protocolo());

        ArgumentCaptor<HistoricoOcorrenciaEntity> historico = ArgumentCaptor.forClass(HistoricoOcorrenciaEntity.class);
        verify(historicoRepository).save(historico.capture());
        assertNull(historico.getValue().getResponsavel()); // cidadão anônimo
    }

    @Test
    void registroSemGpsESemEnderecoEhRecusado() {
        assertThrows(RegraNegocioException.class, () -> service.registrarPublica(dto(null, "  ", null)));
        verify(ocorrenciaRepository, never()).save(any());
    }

    @Test
    void registroManualExigeUrgencia() {
        assertThrows(RegraNegocioException.class, () -> service.registrarManual(dto(null, "Rua A", null), 1L));
    }

    @Test
    void comunicanteAnonimoNaoTemDadosGuardados() {
        OcorrenciaResponseDTO resposta = service.registrarPublica(
                dto(null, "Rua A", new ReportanteRequestDTO("João", "71999999999", true)));

        assertNull(resposta.reportante().nome());
        assertNull(resposta.reportante().telefone());
    }

    @Test
    void protocoloRepetidoGeraOutro() {
        when(geradorProtocolo.gerar()).thenReturn("CAA-261012-00001", "CAA-261012-00002");
        when(ocorrenciaRepository.existsByProtocolo("CAA-261012-00001")).thenReturn(true);

        OcorrenciaResponseDTO resposta = service.registrarPublica(dto(null, "Rua A", null));

        assertEquals("CAA-261012-00002", resposta.protocolo());
    }

    @Test
    void filaColocaMaisUrgenteNoTopo() {
        LocalDateTime agora = LocalDateTime.now();
        OcorrenciaEntity baixa = ocorrencia(10L, OcorrenciaStatus.REGISTRADA, GrauUrgencia.BAIXA, agora.minusHours(5));
        OcorrenciaEntity critica = ocorrencia(11L, OcorrenciaStatus.REGISTRADA, GrauUrgencia.CRITICA, agora);
        when(ocorrenciaRepository.findByOcorrenciaStatusNotOrderByDataHoraRegistroDesc(OcorrenciaStatus.CONCLUIDO))
                .thenReturn(List.of(baixa, critica));

        List<OcorrenciaResponseDTO> fila = service.listarAtivas();

        assertEquals(11L, fila.get(0).id());
        assertEquals(10L, fila.get(1).id());
    }

    @Test
    void statusSoAvancaEGravaHistoricoComResponsavel() {
        OcorrenciaEntity o = ocorrencia(10L, OcorrenciaStatus.REGISTRADA, GrauUrgencia.ALTA, LocalDateTime.now());
        when(ocorrenciaRepository.findById(10L)).thenReturn(Optional.of(o));

        service.atualizarStatus(10L, new AtualizarStatusRequestDTO(OcorrenciaStatus.TRIAGEM, 1L));

        assertEquals(OcorrenciaStatus.TRIAGEM, o.getOcorrenciaStatus());
        ArgumentCaptor<HistoricoOcorrenciaEntity> historico = ArgumentCaptor.forClass(HistoricoOcorrenciaEntity.class);
        verify(historicoRepository).save(historico.capture());
        assertEquals(atendente, historico.getValue().getResponsavel());

        assertThrows(RegraNegocioException.class,
                () -> service.atualizarStatus(10L, new AtualizarStatusRequestDTO(OcorrenciaStatus.REGISTRADA, 1L)));
    }

    @Test
    void ocorrenciaConcluidaNaoPodeSerAlterada() {
        OcorrenciaEntity o = ocorrencia(10L, OcorrenciaStatus.CONCLUIDO, GrauUrgencia.ALTA, LocalDateTime.now());
        when(ocorrenciaRepository.findById(10L)).thenReturn(Optional.of(o));

        assertThrows(RegraNegocioException.class, () -> service.alterarUrgencia(10L, GrauUrgencia.BAIXA, 1L));
    }

    @Test
    void concluirLiberaEquipe() {
        EquipeEntity equipe = EquipeEntity.builder().id(5L).nome("Alfa").status(EquipeStatus.OCUPADO).build();
        OcorrenciaEntity o = ocorrencia(10L, OcorrenciaStatus.RESGATE, GrauUrgencia.ALTA, LocalDateTime.now());
        o.setEquipe(equipe);
        when(ocorrenciaRepository.findById(10L)).thenReturn(Optional.of(o));

        service.atualizarStatus(10L, new AtualizarStatusRequestDTO(OcorrenciaStatus.CONCLUIDO, 1L));

        assertEquals(EquipeStatus.DISPONIVEL, equipe.getStatus());
    }

    @Test
    void naoAtribuiEquipeOcupada() {
        OcorrenciaEntity o = ocorrencia(10L, OcorrenciaStatus.TRIAGEM, GrauUrgencia.ALTA, LocalDateTime.now());
        EquipeEntity ocupada = EquipeEntity.builder().id(6L).nome("Beta").status(EquipeStatus.OCUPADO).build();
        when(ocorrenciaRepository.findById(10L)).thenReturn(Optional.of(o));
        when(equipeService.buscarEntidade(6L)).thenReturn(ocupada);

        assertThrows(RegraNegocioException.class, () -> service.atribuirEquipe(10L, 6L, 1L));
        assertNull(o.getEquipe());
    }

    @Test
    void trocaDeEquipeLiberaAntigaEOcupaNova() {
        EquipeEntity antiga = EquipeEntity.builder().id(5L).nome("Alfa").status(EquipeStatus.OCUPADO).build();
        EquipeEntity nova = EquipeEntity.builder().id(6L).nome("Beta").status(EquipeStatus.DISPONIVEL).build();
        OcorrenciaEntity o = ocorrencia(10L, OcorrenciaStatus.ATENDIMENTO, GrauUrgencia.ALTA, LocalDateTime.now());
        o.setEquipe(antiga);
        when(ocorrenciaRepository.findById(10L)).thenReturn(Optional.of(o));
        when(equipeService.buscarEntidade(6L)).thenReturn(nova);

        service.atribuirEquipe(10L, 6L, 1L);

        assertEquals(nova, o.getEquipe());
        assertEquals(EquipeStatus.DISPONIVEL, antiga.getStatus());
        assertEquals(EquipeStatus.OCUPADO, nova.getStatus());
    }

    private OcorrenciaEntity ocorrencia(Long id, OcorrenciaStatus status, GrauUrgencia urgencia, LocalDateTime data) {
        return OcorrenciaEntity.builder()
                .id(id)
                .protocolo("CAA-" + id)
                .ocorrenciaStatus(status)
                .grauUrgencia(urgencia)
                .dataHoraRegistro(data)
                .build();
    }
}
