package com.redsocial.usuarios;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El correo es obligatorio") String email,
        @NotBlank(message = "La contrase\u00f1a es obligatoria") String password) {
}
