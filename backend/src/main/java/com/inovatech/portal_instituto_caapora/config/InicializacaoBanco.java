package com.inovatech.portal_instituto_caapora.config;

import com.inovatech.portal_instituto_caapora.dto.request.FuncionarioRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.request.PerfilRequestDTO;
import com.inovatech.portal_instituto_caapora.exception.UsuarioExistenteException;
import com.inovatech.portal_instituto_caapora.service.FuncionarioService;
import com.inovatech.portal_instituto_caapora.service.MidiaService;
import com.inovatech.portal_instituto_caapora.service.PerfilService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InicializacaoBanco implements CommandLineRunner {

    private final FuncionarioService funcionarioService;
    private final PerfilService perfilService;

    private final MidiaService midiaService;

    @Value("${app.bootstrap.admin.nome}")
    private String nomeAdmin;

    @Value("${app.bootstrap.admin.email}")
    private String emailAdmin;

    @Value("${app.bootstrap.admin.senha}")
    private String senhaAdmin;

    @Override
    public void run(String... args) throws Exception {

        perfilService.criar(new PerfilRequestDTO("COORDENADOR"));
        perfilService.criar(new PerfilRequestDTO("ATENDENTE"));
        perfilService.criar(new PerfilRequestDTO("EQUIPE_CAMPO"));

        if (funcionarioService.existsByEmail(emailAdmin)) {
            return;
        }

        Long idPerfil = perfilService.buscarPorPerfil(new PerfilRequestDTO("COORDENADOR")).id();

        funcionarioService.criar(new FuncionarioRequestDTO(
                this.nomeAdmin,
                this.emailAdmin,
                this.senhaAdmin,
                idPerfil,
                null
        ));
    }
}
