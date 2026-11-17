package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.config.TokenProvider;
import com.inovatech.portal_instituto_caapora.dto.request.LoginRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.TokenResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final TokenProvider tokenProvider;

    @Value("${spring.jwt.expiration}")
    private Long expiration;
    public TokenResponseDTO login(LoginRequestDTO dto){

        try{

            Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(dto.email(), dto.senha()));

            String token = tokenProvider.gerarToken(authentication);

            return new TokenResponseDTO(token, expiration);
        } catch (BadCredentialsException e){
            throw new BadCredentialsException("Credenciais invalidas");
        } catch (Exception e){
            throw e;
        }

    }
}