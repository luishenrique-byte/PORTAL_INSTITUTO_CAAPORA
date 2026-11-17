package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.dto.request.LoginRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.FuncionarioResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.TokenResponseDTO;
import com.inovatech.portal_instituto_caapora.service.AuthenticationService;
import com.inovatech.portal_instituto_caapora.service.FuncionarioService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@AllArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;
    private final FuncionarioService funcionarioService;

    @PostMapping("/login")
    public TokenResponseDTO login(@RequestBody @Valid LoginRequestDTO loginRequestDTO){
        return authenticationService.login(loginRequestDTO);
    }

    // Funcionário dono do token (o JWT só carrega o e-mail).
    // O painel usa o id nas ações (status, urgência, equipe) e o perfil para montar o menu.
    // GET /auth/me
    @GetMapping("/me")
    public FuncionarioResponseDTO usuarioLogado(Authentication authentication) {
        return funcionarioService.buscarPorEmail(authentication.getName());
    }
}
