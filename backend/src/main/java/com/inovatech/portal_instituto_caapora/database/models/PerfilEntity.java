package com.inovatech.portal_instituto_caapora.database.models;

import jakarta.persistence.*;
import lombok.*;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;

import java.util.Set;

@Entity
@Table(name = "perfil")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class PerfilEntity implements GrantedAuthority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String perfil;

    @OneToMany(mappedBy = "perfil")
    private Set<FuncionarioEntity> funcionarios;

    @Override
    public @Nullable String getAuthority() {
        return "";
    }
}
