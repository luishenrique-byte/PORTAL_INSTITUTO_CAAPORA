package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.AnimalEntity;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.SaudeStatus;
import com.inovatech.portal_instituto_caapora.database.models.EquipeEntity;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.ReportanteEntity;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RastreioOcorrenciaResponseDTOTest {

    @Test
    void removeNumerosDoEndereco() {
        assertEquals("Av. Paralela - Salvador", RastreioOcorrenciaResponseDTO.localSemNumero("Av. Paralela, 3200 - Salvador"));
        assertEquals("Rua A, Imbuí, Salvador", RastreioOcorrenciaResponseDTO.localSemNumero("Rua A, nº 12, Imbuí, Salvador"));
        assertEquals("Rua das Flores, Salvador", RastreioOcorrenciaResponseDTO.localSemNumero("Rua das Flores, 45B, Salvador, 40000-000"));
        assertNull(RastreioOcorrenciaResponseDTO.localSemNumero("123"));
        assertNull(RastreioOcorrenciaResponseDTO.localSemNumero(null));
    }

    @Test
    void montaVisaoPublicaSemDadosDoComunicante() {
        OcorrenciaEntity ocorrencia = OcorrenciaEntity.builder()
                .protocolo("CAA-260922-17852")
                .dataHoraRegistro(LocalDateTime.of(2026, 9, 22, 9, 14))
                .endereco("Av. Paralela, 3200 - Salvador")
                .ocorrenciaStatus(OcorrenciaStatus.ATENDIMENTO)
                .animal(AnimalEntity.builder().categoriaAnimal(CategoriaAnimal.AVE).especie("Gavião-carcará").saudeStatus(SaudeStatus.FERIDO).build())
                .equipe(EquipeEntity.builder().nome("Equipe Alfa").build())
                .reportante(ReportanteEntity.builder().nome("Maria").telefone("71999990000").anonimo(false).build())
                .build();
        List<HistoricoOcorrenciaEntity> historico = List.of(
                HistoricoOcorrenciaEntity.builder().statusMovimentacao(OcorrenciaStatus.REGISTRADA).dataHora(LocalDateTime.of(2026, 9, 22, 9, 14)).build(),
                HistoricoOcorrenciaEntity.builder().statusMovimentacao(OcorrenciaStatus.ATENDIMENTO).dataHora(LocalDateTime.of(2026, 9, 22, 11, 40)).build());

        RastreioOcorrenciaResponseDTO dto = RastreioOcorrenciaResponseDTO.fromEntity(ocorrencia, historico);

        assertEquals(CategoriaAnimal.AVE, dto.categoriaAnimal());
        assertEquals("Gavião-carcará", dto.especie());
        assertEquals("Av. Paralela - Salvador", dto.local());
        assertFalse(dto.localPorGps());
        assertEquals("Equipe Alfa", dto.equipe());
        assertEquals(2, dto.linhaDoTempo().size());
        assertFalse(dto.toString().contains("Maria"));
        assertFalse(dto.toString().contains("7199999"));
    }

    @Test
    void semEnderecoMasComGpsIndicaLocalPorGps() {
        OcorrenciaEntity ocorrencia = OcorrenciaEntity.builder()
                .protocolo("CAA-1").latitude(-12.9).longitude(-38.4)
                .ocorrenciaStatus(OcorrenciaStatus.REGISTRADA).build();

        RastreioOcorrenciaResponseDTO dto = RastreioOcorrenciaResponseDTO.fromEntity(ocorrencia, List.of());

        assertNull(dto.local());
        assertTrue(dto.localPorGps());
        assertNull(dto.equipe());
        assertNull(dto.categoriaAnimal());
    }
}
