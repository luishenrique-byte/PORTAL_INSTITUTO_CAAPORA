package com.inovatech.portal_instituto_caapora.database.models;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.TipoMidia;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "midia_anexo")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class MidiaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "url_midia")
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "tipo_midia")
    private TipoMidia tipoMidia;

    @ManyToOne
    @JoinColumn(name = "id_ocorrencia")
    private OcorrenciaEntity ocorrencia;
}
