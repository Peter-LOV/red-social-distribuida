package com.redsocial.usuarios;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank @Size(max = 80) String nombre,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 100) String password) {
}
