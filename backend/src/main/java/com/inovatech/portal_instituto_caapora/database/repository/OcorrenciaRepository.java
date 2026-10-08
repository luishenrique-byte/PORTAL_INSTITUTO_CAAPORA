package com.inovatech.portal_instituto_caapora.database.repository;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OcorrenciaRepository extends JpaRepository<OcorrenciaEntity, Long> {

    // Rastreio público pelo número de protocolo (RF04)
    Optional<OcorrenciaEntity> findByProtocolo(String protocolo);

    // Garante que o protocolo gerado é único antes de salvar (US 7.2.1)
    boolean existsByProtocolo(String protocolo);

    List<OcorrenciaEntity> findByOcorrenciaStatus(OcorrenciaStatus status);

    // Ocorrências ativas no painel do coordenador (US 7.4.1)
    List<OcorrenciaEntity> findByOcorrenciaStatusNotOrderByDataHoraRegistroDesc(OcorrenciaStatus status);

    List<OcorrenciaEntity> findByGrauUrgencia(GrauUrgencia grauUrgencia);

    List<OcorrenciaEntity> findByEquipeId(Long equipeId);

    // Filtro por período para relatórios (RF15)
    List<OcorrenciaEntity> findByDataHoraRegistroBetween(LocalDateTime inicio, LocalDateTime fim);
}
