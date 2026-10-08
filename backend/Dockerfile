FROM eclipse-temurin:21-jdk AS build

# Maven Wrapper necesita unzip para descargar Maven en formato .zip
RUN apt-get update \
    && apt-get install -y unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./

# Windows guarda los scripts con saltos de línea CRLF; en Linux hay que convertirlos
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

COPY src src

# La caché de Maven (/root/.m2) se conserva entre builds: si la red se corta a mitad de la
# descarga, el siguiente intento continúa donde se quedó en lugar de empezar de cero.
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B package -DskipTests -Daether.connector.http.retryHandler.count=5


FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/quarkus-app/ ./

EXPOSE 8080

CMD ["java", "-jar", "quarkus-run.jar"]