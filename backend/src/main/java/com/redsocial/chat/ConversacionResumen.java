package com.redsocial.chat;

public record ConversacionResumen(
    String id,
    String otroId,
    String otroNombre,
    String ultimoTexto,
    String ultimaFecha,
    String ultimoMensajeId,
    String ultimoAutorId
) {}