package com.inovatech.portal_instituto_caapora.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class TokenProvider {

    @Value("${spring.jwt.expiration}")
    private Long expirationTime;

    @Value("${spring.jwt.key}")
    private String key;

    //gerar token
    public String gerarToken(Authentication authentication) {
        UserDetails user = (UserDetails) authentication.getPrincipal();

        return buildToken(user.getUsername());
    }

    private String buildToken(String username) {
        Date now = new Date();
        Date expiration =  new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey())
                .compact();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(key.getBytes());
    }

    //validar token

    public boolean isTokenValid(String token) {
        try{
            getClaimsFromToken(token);
            return true;
        }catch (Exception e){
            return false;
        }
    }

    private Claims getClaimsFromToken(String token) {
        //validar assinatura

        //validar expiracao
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }


    //Extrair informações do token
    public String getUsernameFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }
}
