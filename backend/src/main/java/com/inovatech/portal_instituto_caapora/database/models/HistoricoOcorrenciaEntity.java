package com.inovatech.portal_instituto_caapora.database.models;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "historico_ocorrencia")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class HistoricoOcorrenciaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_ocorrencia")
    private OcorrenciaEntity ocorrencia;

    @ManyToOne
    @JoinColumn(name = "id_usuario")
    private FuncionarioEntity responsavel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status_movimentacao")
    private OcorrenciaStatus statusMovimentacao;

    @Column(nullable = false, name = "data_hora")
    private LocalDateTime dataHora;
}
