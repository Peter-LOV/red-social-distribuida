package com.redsocial.chat;

public record MensajeGuardado(
    String id,
    String fecha,
    String destinatarioId
) {}