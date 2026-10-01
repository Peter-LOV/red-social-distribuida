package com.redsocial.posts;

import java.util.Map;
import java.util.UUID;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/** Todo el acceso al almacenamiento S3 (RustFS). Neo4j solo guarda la clave devuelta por subir(). */
@ApplicationScoped
public class AlmacenamientoService {

    private static final Map<String, String> EXTENSIONES = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif");

    @Inject
    S3Client s3;

    @ConfigProperty(name = "app.s3.bucket")
    String bucket;

    /** Crea el bucket al arrancar si no existe. */
    void alArrancar(@Observes StartupEvent ev) {
        try {
            s3.headBucket(b -> b.bucket(bucket));
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                s3.createBucket(b -> b.bucket(bucket));
            } else {
                throw e;
            }
        }
    }

    /** Sube la imagen y devuelve la clave del objeto (lo unico que se guarda en Neo4j). */
    public String subir(FileUpload archivo) {
        String ext = EXTENSIONES.get(archivo.contentType());
        if (ext == null) {
            throw new BadRequestException("Solo se permiten im\u00e1genes JPG, PNG, WEBP o GIF");
        }
        String clave = UUID.randomUUID() + "." + ext;
        s3.putObject(
                PutObjectRequest.builder().bucket(bucket).key(clave).contentType(archivo.contentType()).build(),
                RequestBody.fromFile(archivo.uploadedFile()));
        return clave;
    }

    public ResponseInputStream<GetObjectResponse> obtener(String clave) {
        return s3.getObject(b -> b.bucket(bucket).key(clave));
    }

    /** Borra un objeto (para no dejar imagenes huerfanas si falla el guardado del post). */
    public void eliminar(String clave) {
        s3.deleteObject(b -> b.bucket(bucket).key(clave));
    }
}