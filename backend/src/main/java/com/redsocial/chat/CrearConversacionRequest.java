package com.redsocial.chat;

import jakarta.validation.constraints.NotBlank;

public record CrearConversacionRequest(
    @NotBlank(message = "El usuarioId es obligatorio")
    String usuarioId
) {}