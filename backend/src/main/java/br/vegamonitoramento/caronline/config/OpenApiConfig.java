package br.vegamonitoramento.caronline.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CAR Online API")
                        .description("API do Módulo CAR ONLINE do projeto SiCAR")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Vega Monitoramento")
                                .email("contato@vegamonitoramento.com.br")
                                .url("https://vegamonitoramento.com.br"))
                        .license(new License()
                                .name("Licença Proprietária")
                                .url("https://vegamonitoramento.com.br/licenca")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:9291" + contextPath)
                                .description("Servidor Local")
                ));
    }
}