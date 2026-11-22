package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.config.TokenProvider;
import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.dto.request.LoginRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.TokenResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final TokenProvider tokenProvider;
    private final FuncionarioService funcionarioService;

    @Value("${spring.jwt.expiration}")
    private Long expiration;
    public TokenResponseDTO login(LoginRequestDTO dto){

        try{

            Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(dto.email(), dto.senha()));

            String token = tokenProvider.gerarToken(authentication);

            return new TokenResponseDTO(token, expiration);
        } catch (BadCredentialsException e){
            throw new BadCredentialsException("Credenciais invalidas");
        }

    }

    public TokenResponseDTO refresh(String email){
        Long idFuncionario = funcionarioService.buscarPorEmail(email).id();

        FuncionarioEntity funcionario = funcionarioService.buscarEntidade(idFuncionario);

        if(Boolean.FALSE.equals(funcionario.getAtivo())){
            throw new DisabledException("Usuário inativo. Acesso revogado.");
        }

        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                funcionario.getUsername(),
                null,
                funcionario.getAuthorities()));

        String novoToken = tokenProvider.gerarToken(authentication);

        return new TokenResponseDTO(novoToken,expiration);
    }

    public String getUsernameFromToken(String token) {
        return tokenProvider.getUsernameFromToken(token);
    }
}