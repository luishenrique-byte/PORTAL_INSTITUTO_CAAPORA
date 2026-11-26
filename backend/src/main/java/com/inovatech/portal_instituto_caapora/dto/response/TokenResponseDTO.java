package com.inovatech.portal_instituto_caapora.dto.response;

public record TokenResponseDTO (
        String token,
        long expiresIn
){}
