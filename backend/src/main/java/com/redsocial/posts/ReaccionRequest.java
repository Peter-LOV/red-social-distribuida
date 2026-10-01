package com.redsocial.posts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ReaccionRequest(
        @NotBlank(message = "El tipo es obligatorio")
        @Pattern(regexp = "LIKE|LOVE|HAHA|WOW", message = "Tipo inv\u00e1lido (LIKE, LOVE, HAHA o WOW)")
        String tipo) {
}