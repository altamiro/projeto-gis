package br.vegamonitoramento.caronline.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/example")
@Tag(name = "Example", description = "API de exemplo para demonstração do OpenAPI")
public class ExampleController {

    @Operation(summary = "Obter informações do sistema", description = "Retorna informações básicas sobre o sistema CAR Online")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Operação bem sucedida", 
                    content = { @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = Map.class)) }),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", "CAR Online");
        info.put("version", "1.0.0");
        info.put("status", "active");
        info.put("environment", "development");
        return ResponseEntity.ok(info);
    }

    @Operation(summary = "Obter status por ID", description = "Retorna o status de um elemento específico pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Elemento encontrado"),
            @ApiResponse(responseCode = "404", description = "Elemento não encontrado")
    })
    @GetMapping("/status/{id}")
    public ResponseEntity<String> getStatus(
            @Parameter(description = "ID do elemento", required = true) @PathVariable Long id) {
        // Lógica simulada
        if (id > 0 && id < 100) {
            return ResponseEntity.ok("Active");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}