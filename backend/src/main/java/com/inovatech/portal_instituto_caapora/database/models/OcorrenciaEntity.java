package com.inovatech.portal_instituto_caapora.database.models;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OrigemRegistro;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "ocorrencia")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class OcorrenciaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "protocolo")
    private String protocolo;

    @Column(nullable = false, name = "data_hora")
    private LocalDateTime dataHoraRegistro;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "endereco")
    private String endereco;

    @Column(name = "ponto_referencia")
    private String pontoReferencia;

    @Column(name = "descricao")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "grau_urgencia")
    private GrauUrgencia grauUrgencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "origem_registro")
    private OrigemRegistro origemRegistro;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_ocorrencia")
    private OcorrenciaStatus ocorrenciaStatus;

    @OneToOne
    @JoinColumn(name = "id_reportante")
    private ReportanteEntity reportante;

    @OneToOne
    @JoinColumn(name = "id_animal")
    private AnimalEntity animal;

    @ManyToOne
    @JoinColumn(name = "id_equipe")
    private EquipeEntity equipe;

    @OneToMany(mappedBy = "ocorrencia")
    private Set<MidiaEntity> midias;

}