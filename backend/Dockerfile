FROM eclipse-temurin:21-jdk AS build

# Maven Wrapper necesita unzip para descargar Maven en formato .zip
RUN apt-get update \
    && apt-get install -y unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./

# Windows guarda los scripts con saltos de línea CRLF; en Linux hay que convertirlos
RUN sed -i 's/\r$//' mvnw \
    && chmod +x mvnw \
    && ./mvnw -B dependency:go-offline

COPY src src

RUN ./mvnw -B package -DskipTests


FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/quarkus-app/ ./

EXPOSE 8080

CMD ["java", "-jar", "quarkus-run.jar"]