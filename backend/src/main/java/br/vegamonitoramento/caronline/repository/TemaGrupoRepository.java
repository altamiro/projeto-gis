package br.vegamonitoramento.caronline.repository;

import br.vegamonitoramento.caronline.model.dto.TemaGrupoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Repository
public class TemaGrupoRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public TemaGrupoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TemaGrupoDTO> findAllTemasGrupos() {
        String sql = """
                WITH grupos AS (
                  SELECT
                    t.idt_tema,
                    UPPER(REPLACE(unaccent(g.nom_grupo), ' ', '_')) AS grp,
                    t.cod_tema,
                    t.nom_tema,
                    t.ind_tipo_tema
                  FROM usr_geocar_aplicacao.tema AS t
                  JOIN usr_geocar_aplicacao.grupo AS g
                    ON g.idt_grupo = t.idt_grupo
                  WHERE t.idt_tema NOT IN (33, 34)
                )
                SELECT
                  g.idt_tema,
                  CASE
                    WHEN g.grp = 'AREA_DO_IMOVEL' THEN 1
                    WHEN g.grp = 'COBERTURA_DO_SOLO' THEN 2
                    WHEN g.grp = 'SERVIDAO_ADMINISTRATIVA' THEN 3
                    WHEN g.grp IN ('AREA_DE_PRESERVACAO_PERMANENTE', 'AREA_DE_USO_RESTRITO') THEN 4
                    WHEN g.grp = 'RESERVA_LEGAL' THEN 5
                    ELSE NULL
                  END AS cod_ordem,
                  CASE
                    WHEN g.grp IN ('AREA_DE_PRESERVACAO_PERMANENTE', 'AREA_DE_USO_RESTRITO')
                      THEN 'APP_E_USO_RESTRITO'
                    WHEN g.grp = 'AREA_DO_IMOVEL'
                      THEN 'IMOVEL'
                    ELSE g.grp
                  END AS nom_grupo,
                  CASE
                    WHEN g.grp IN ('AREA_DE_PRESERVACAO_PERMANENTE', 'AREA_DE_USO_RESTRITO')
                      THEN 'App / Uso Restrito'
                    WHEN g.grp = 'AREA_DO_IMOVEL'
                      THEN 'Imóvel'
                    WHEN g.grp = 'COBERTURA_DO_SOLO'
                      THEN 'Cobertura do Solo'
                    WHEN g.grp = 'SERVIDAO_ADMINISTRATIVA'
                      THEN 'Servidão Administrativa'
                    WHEN g.grp = 'RESERVA_LEGAL'
                      THEN 'Reserva Legal'
                    ELSE NULL
                  END AS des_grupo,
                  g.cod_tema,
                  g.nom_tema,
                  g.ind_tipo_tema,
                  CASE
                    WHEN g.cod_tema IN (
                      'AREA_IMOVEL_LIQUIDA',
                      'AREA_ANTROPIZADA_APOS_2008_NAO_VETORIZADA',
                      'AREA_NAO_CLASSIFICADA',
                      'AREA_SERVIDAO_ADMINISTRATIVA_TOTAL',
                      'CORPO_DAGUA',
                      'APP_A_RECUPERAR',
                      'ARL_TOTAL'
                    ) THEN false
                    ELSE true
                  END AS fl_visivel_mapa
                FROM grupos AS g
                ORDER BY cod_ordem, nom_grupo, nom_tema
                """;
        
        return jdbcTemplate.query(sql, new TemaGrupoRowMapper());
    }
    
    /**
     * Retorna os temas agrupados usando a chave "codOrdem_nomGrupo"
     */
    public Map<String, List<TemaGrupoDTO>> findAllTemasGruposAgrupados() {
        List<TemaGrupoDTO> temas = findAllTemasGrupos();
        
        // Ordenar usando TreeMap para manter a ordem dos grupos
        Map<String, List<TemaGrupoDTO>> result = new TreeMap<>();
        
        // Agrupar usando a combinação de codOrdem e nomGrupo como chave
        result = temas.stream()
                .collect(Collectors.groupingBy(
                        tema -> tema.getCodOrdem() + "_" + tema.getNomGrupo(),
                        TreeMap::new,  // Usar TreeMap para manter a ordem
                        Collectors.toList()
                ));
        
        return result;
    }
    
    private static class TemaGrupoRowMapper implements RowMapper<TemaGrupoDTO> {
        @Override
        public TemaGrupoDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
            TemaGrupoDTO dto = new TemaGrupoDTO();
            dto.setIdtTema(rs.getLong("idt_tema"));
            dto.setCodOrdem(rs.getObject("cod_ordem", Integer.class)); // Handle nullable Integer
            dto.setNomGrupo(rs.getString("nom_grupo"));
            dto.setDesGrupo(rs.getString("des_grupo"));
            dto.setCodTema(rs.getString("cod_tema"));
            dto.setNomTema(rs.getString("nom_tema"));
            dto.setIndTipoTema(rs.getString("ind_tipo_tema"));
            dto.setFlVisivelMapa(rs.getBoolean("fl_visivel_mapa"));
            return dto;
        }
    }
}