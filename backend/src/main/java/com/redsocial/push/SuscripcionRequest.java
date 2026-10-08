package com.redsocial.push;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Cuerpo que envía el navegador: es el resultado de PushSubscription.toJSON(). */
public record SuscripcionRequest(
        @NotBlank(message = "endpoint es obligatorio") String endpoint,
        @NotNull(message = "keys es obligatorio") @Valid Keys keys) {

    public record Keys(
            @NotBlank(message = "keys.p256dh es obligatorio") String p256dh,
            @NotBlank(message = "keys.auth es obligatorio") String auth) {
    }
}
