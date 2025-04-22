package br.vegamonitoramento.caronline.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Representação de um Tema Grupo")
public class TemaGrupoDTO {

    @Schema(description = "ID do tema", example = "1")
    private Long idtTema;
    
    @Schema(description = "Nome do grupo", example = "APP_E_USO_RESTRITO")
    private String nomGrupo;
    
    @Schema(description = "Descrição amigável do grupo", example = "App / Uso Restrito")
    private String desGrupo;
    
    @Schema(description = "Código de ordem", example = "4")
    private Integer codOrdem;
    
    @Schema(description = "Código do tema", example = "APP_NASCENTE")
    private String codTema;
    
    @Schema(description = "Nome do tema", example = "Área de Preservação Permanente - Nascente")
    private String nomTema;
    
    @Schema(description = "Indicador de tipo de tema", example = "P")
    private String indTipoTema;
    
    @Schema(description = "Flag de visibilidade no mapa", example = "true")
    private Boolean flVisivelMapa;
}