package br.vegamonitoramento.caronline.controller;

import br.vegamonitoramento.caronline.model.dto.TemaGrupoDTO;
import br.vegamonitoramento.caronline.service.TemaGrupoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/temas-grupos")
@Tag(name = "Temas e Grupos", description = "API para consulta de temas e seus grupos")
public class TemaGrupoController {

    private final TemaGrupoService temaGrupoService;

    @Autowired
    public TemaGrupoController(TemaGrupoService temaGrupoService) {
        this.temaGrupoService = temaGrupoService;
    }

    @Operation(
            summary = "Listar todos os temas e grupos",
            description = "Retorna uma lista de todos os temas organizados por grupos conforme regras específicas de negócio"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Operação bem-sucedida",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = TemaGrupoDTO.class)
                    )
            ),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @GetMapping
    public ResponseEntity<List<TemaGrupoDTO>> getAllTemasGrupos() {
        return ResponseEntity.ok(temaGrupoService.getAllTemasGrupos());
    }
    
    @Operation(
            summary = "Listar todos os temas e grupos (agrupados)",
            description = "Retorna uma lista de todos os temas agrupados por uma chave composta no formato 'codOrdem_nomGrupo'"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Operação bem-sucedida",
                    content = @Content(
                            mediaType = "application/json"
                    )
            ),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @GetMapping("/agrupados")
    public ResponseEntity<Map<String, List<TemaGrupoDTO>>> getAllTemasGruposAgrupados() {
        return ResponseEntity.ok(temaGrupoService.getAllTemasGruposAgrupados());
    }
}