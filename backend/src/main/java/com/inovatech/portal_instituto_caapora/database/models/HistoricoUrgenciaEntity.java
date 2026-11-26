package com.inovatech.portal_instituto_caapora.database.models;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Auditoria das reclassificações de urgência (US 7.2.2, critério 2):
// cada alteração vira uma linha com valor anterior, novo valor, responsável e data/hora.
@Entity
@Table(name = "historico_urgencia")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class HistoricoUrgenciaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(nullable = false, name = "id_ocorrencia")
    private OcorrenciaEntity ocorrencia;

    @ManyToOne
    @JoinColumn(nullable = false, name = "id_usuario")
    private FuncionarioEntity responsavel;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgencia_anterior")
    private GrauUrgencia urgenciaAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "urgencia_nova")
    private GrauUrgencia urgenciaNova;

    @Column(nullable = false, name = "data_hora")
    private LocalDateTime dataHora;
}
