package com.inovatech.portal_instituto_caapora.controller;

import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.dto.request.LoginRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.TokenResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.UsuarioLogadoResponseDTO;
import com.inovatech.portal_instituto_caapora.service.AuthenticationService;
import com.inovatech.portal_instituto_caapora.service.FuncionarioService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/me")
    public UsuarioLogadoResponseDTO getUsuarioLogado(Authentication authentication){
        return funcionarioService.buscarUsuarioLogadoPorEmail(authentication.getName());
    }
}
