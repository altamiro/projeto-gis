/**
 * Constantes para os grupos das camadas
 */
export const BASE_GROUP_LAYER = [
  {
    id: "imovel",
    order: 1,
    title: "Imóvel",
    image: require("@/assets/img/imovel-icon.png"),
    options: [],
  },
  {
    id: "cobertura_do_solo",
    order: 2,
    title: "Cobertura do Solo",
    image: require("@/assets/img/cobertura-icon.png"),
    options: [],
  },
  {
    id: "servidao_administrativa",
    order: 3,
    title: "Servidão Administrativa",
    image: require("@/assets/img/servidao-icon.png"),
    options: [],
  },
  {
    id: "app_e_uso_restrito",
    order: 4,
    title: "App / Uso Restrito",
    image: require("@/assets/img/app-icon.png"),
    options: [],
  },
  {
    id: "reserva_legal",
    order: 5,
    title: "Reserva Legal",
    image: require("@/assets/img/reserva-icon.png"),
    options: [],
  },
];

/**
 * Constantes para os tipos de camadas do sistema GIS
 */
export const LAYER_TYPES = [
  {
    tema_id: 26,
    grupo: "imovel",
    order: 1,
    id: "area_imovel",
    name: "Área do Imóvel",
    tipo_tema: "mult",
    editable: true,
    required: true
  },
  {
    tema_id: 65,
    grupo: "imovel",
    order: 2,
    id: "area_imovel_liquida_analise",
    name: "Área do Imóvel Líquida Análise",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 84,
    grupo: "imovel",
    order: 3,
    id: "area_territorio_pct",
    name: "Área do Território",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 27,
    grupo: "imovel",
    order: 4,
    id: "area_imovel_liquida",
    name: "Área Líquida do Imóvel",
    tipo_tema: "mult",
    editable: false,
    required: false
  },
  {
    tema_id: 81,
    grupo: "imovel",
    order: 5,
    id: "sede_imovel",
    name: "Sede ou Ponto de Referência do Imóvel",
    tipo_tema: "point",
    editable: true,
    required: false
  },
  {
    tema_id: 59,
    grupo: "cobertura_do_solo",
    order: 1,
    id: "area_nao_classificada",
    name: "Área Antropizada Não Consolidada",
    tipo_tema: "mult",
    editable: false,
    required: false
  },
  {
    tema_id: 1,
    grupo: "cobertura_do_solo",
    order: 2,
    id: "area_consolidada",
    name: "Área Consolidada",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 3,
    grupo: "cobertura_do_solo",
    order: 3,
    id: "area_pousio",
    name: "Área de Pousio",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 60,
    grupo: "cobertura_do_solo",
    order: 4,
    id: "corpo_dagua",
    name: "Curso d'água",
    tipo_tema: "mult",
    editable: false,
    required: false
  },
  {
    tema_id: 2,
    grupo: "cobertura_do_solo",
    order: 5,
    id: "vegetacao_nativa",
    name: "Remanescente de Vegetação Nativa",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 29,
    grupo: "servidao_administrativa",
    order: 1,
    id: "area_servidao_administrativa_total",
    name: "Área de Servidão Administrativa Total",
    tipo_tema: "mult",
    editable: false,
    required: false
  },
  {
    tema_id: 28,
    grupo: "servidao_administrativa",
    order: 2,
    id: "area_entorno_reservatorio_energia",
    name: "Entorno de Reservatório para Abastecimento ou Geração de Energia",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 4,
    grupo: "servidao_administrativa",
    order: 3,
    id: "area_infraestrutura_publica",
    name: "Infraestrutura Pública",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 6,
    grupo: "servidao_administrativa",
    order: 4,
    id: "reservatorio_energia",
    name: "Reservatório para Abastecimento ou Geração de Energia",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 5,
    grupo: "servidao_administrativa",
    order: 5,
    id: "area_utilidade_publica",
    name: "Utilidade Pública",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 85,
    grupo: "app_e_uso_restrito",
    order: 1,
    id: "app_area_ac",
    name: "APP em área consolidada",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 83,
    grupo: "app_e_uso_restrito",
    order: 2,
    id: "app_reservatorio_geracao_energia_ate_24_08_2001",
    name: "APP Reservatório de Geração de Energia Elétrica Construído até 24/08/2001",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 31,
    grupo: "app_e_uso_restrito",
    order: 3,
    id: "app_escadinha",
    name: "APP Segundo art. 61-A da Lei nº 12.651/2012",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 30,
    grupo: "app_e_uso_restrito",
    order: 4,
    id: "app_total",
    name: "APP Total",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 19,
    grupo: "app_e_uso_restrito",
    order: 5,
    id: "area_altitude_superior_1800",
    name: "Área com Altitude Superior a 1.800 Metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 20,
    grupo: "app_e_uso_restrito",
    order: 6,
    id: "area_declividade_maior_45",
    name: "Área de Declividade Maior Que 45 Graus",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 42,
    grupo: "app_e_uso_restrito",
    order: 7,
    id: "app_escadinha_lago_natural",
    name: "Área de Preservação Permanente a Recompor de Lagos e Lagoas Naturais",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 43,
    grupo: "app_e_uso_restrito",
    order: 8,
    id: "app_escadinha_nascente_olho_dagua",
    name: "Área de Preservação Permanente a Recompor de Nascentes ou Olhos D'água Perenes",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 36,
    grupo: "app_e_uso_restrito",
    order: 9,
    id: "app_escadinha_rio_ate_10",
    name: "Área de Preservação Permanente a Recompor de Rios até 10 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 40,
    grupo: "app_e_uso_restrito",
    order: 10,
    id: "app_escadinha_rio_acima_600",
    name: "Área de Preservação Permanente a Recompor de Rios com mais de 600 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 37,
    grupo: "app_e_uso_restrito",
    order: 11,
    id: "app_escadinha_rio_10_a_50",
    name: "Área de Preservação Permanente a Recompor de Rios de 10 até 50 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 39,
    grupo: "app_e_uso_restrito",
    order: 12,
    id: "app_escadinha_rio_200_a_600",
    name: "Área de Preservação Permanente a Recompor de Rios de 200 até 600 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 38,
    grupo: "app_e_uso_restrito",
    order: 13,
    id: "app_escadinha_rio_50_a_200",
    name: "Área de Preservação Permanente a Recompor de Rios de 50 até 200 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 41,
    grupo: "app_e_uso_restrito",
    order: 14,
    id: "app_escadinha_vereda",
    name: "Área de Preservação Permanente a Recompor de Veredas",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 55,
    grupo: "app_e_uso_restrito",
    order: 15,
    id: "app_area_altitude_superior_1800",
    name: "Área de Preservação Permanente de Áreas com Altitude Superior a 1800 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 58,
    grupo: "app_e_uso_restrito",
    order: 16,
    id: "app_area_declividade_maior_45",
    name: "Área de Preservação Permanente de Áreas com Declividades Superiores a 45 graus",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 64,
    grupo: "app_e_uso_restrito",
    order: 17,
    id: "app_banhado",
    name: "Área de Preservação Permanente de Banhado",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 56,
    grupo: "app_e_uso_restrito",
    order: 18,
    id: "app_borda_chapada",
    name: "Área de Preservação Permanente de Bordas de Chapada",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 50,
    grupo: "app_e_uso_restrito",
    order: 19,
    id: "app_lago_natural",
    name: "Área de Preservação Permanente de Lagos e Lagoas Naturais",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 54,
    grupo: "app_e_uso_restrito",
    order: 20,
    id: "app_manguezal",
    name: "Área de Preservação Permanente de Manguezais",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 49,
    grupo: "app_e_uso_restrito",
    order: 21,
    id: "app_nascente_olho_dagua",
    name: "Área de Preservação Permanente de Nascentes ou Olhos D'água Perenes",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 51,
    grupo: "app_e_uso_restrito",
    order: 22,
    id: "app_reservatorio_artificial_decorrente_barramento",
    name: "Área de Preservação Permanente de Reservatório artificial decorrente de barramento de cursos d’água",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 57,
    grupo: "app_e_uso_restrito",
    order: 23,
    id: "app_restinga",
    name: "Área de Preservação Permanente de Restingas",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 44,
    grupo: "app_e_uso_restrito",
    order: 24,
    id: "app_rio_ate_10",
    name: "Área de Preservação Permanente de Rios até 10 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 48,
    grupo: "app_e_uso_restrito",
    order: 25,
    id: "app_rio_acima_600",
    name: "Área de Preservação Permanente de Rios com mais de 600 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 45,
    grupo: "app_e_uso_restrito",
    order: 26,
    id: "app_rio_10_a_50",
    name: "Área de Preservação Permanente de Rios de 10 até 50 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 47,
    grupo: "app_e_uso_restrito",
    order: 27,
    id: "app_rio_200_a_600",
    name: "Área de Preservação Permanente de Rios de 200 até 600 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 46,
    grupo: "app_e_uso_restrito",
    order: 28,
    id: "app_rio_50_a_200",
    name: "Área de Preservação Permanente de Rios de 50 até 200 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 53,
    grupo: "app_e_uso_restrito",
    order: 29,
    id: "app_area_topo_morro",
    name: "Área de Preservação Permanente de Topos de Morro",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 52,
    grupo: "app_e_uso_restrito",
    order: 30,
    id: "app_vereda",
    name: "Área de Preservação Permanente de Veredas",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 62,
    grupo: "app_e_uso_restrito",
    order: 31,
    id: "app_vazio",
    name: "Área de Preservação Permanente em área antropizada não declarada como área consolidada",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 61,
    grupo: "app_e_uso_restrito",
    order: 32,
    id: "app_area_vn",
    name: "Área de Preservação Permanente em área de Vegetação Nativa",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 22,
    grupo: "app_e_uso_restrito",
    order: 33,
    id: "area_topo_morro",
    name: "Área de topo de morro",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 7,
    grupo: "app_e_uso_restrito",
    order: 34,
    id: "area_uso_restrito_declividade_25_a_45",
    name: "Área de Uso Restrito para declividade de 25 a 45 graus",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 8,
    grupo: "app_e_uso_restrito",
    order: 35,
    id: "area_uso_restrito_pantaneira",
    name: "Área de Uso Restrito para regiões pantaneiras",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 63,
    grupo: "app_e_uso_restrito",
    order: 36,
    id: "banhado",
    name: "Banhado",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 21,
    grupo: "app_e_uso_restrito",
    order: 37,
    id: "borda_chapada",
    name: "Borda de chapada",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 13,
    grupo: "app_e_uso_restrito",
    order: 38,
    id: "rio_acima_600",
    name: "Curso d'água natural acima de 600 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 10,
    grupo: "app_e_uso_restrito",
    order: 39,
    id: "rio_10_a_50",
    name: "Curso d'água natural de 10 a 50 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 12,
    grupo: "app_e_uso_restrito",
    order: 40,
    id: "rio_200_a_600",
    name: "Curso d'água natural de 200 a 600 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 11,
    grupo: "app_e_uso_restrito",
    order: 41,
    id: "rio_50_a_200",
    name: "Curso d'água natural de 50 a 200 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 9,
    grupo: "app_e_uso_restrito",
    order: 42,
    id: "rio_ate_10",
    name: "Curso d'água natural de até 10 metros",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 14,
    grupo: "app_e_uso_restrito",
    order: 43,
    id: "lago_natural",
    name: "Lago ou lagoa natural",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 17,
    grupo: "app_e_uso_restrito",
    order: 44,
    id: "manguezal",
    name: "Manguezal",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 15,
    grupo: "app_e_uso_restrito",
    order: 45,
    id: "nascente_olho_dagua",
    name: "Nascente ou olho d'água perene",
    tipo_tema: "point",
    editable: true,
    required: false
  },
  {
    tema_id: 16,
    grupo: "app_e_uso_restrito",
    order: 46,
    id: "reservatorio_artificial_decorrente_barramento",
    name: "Reservatório artificial decorrente de barramento ou represamento de cursos d'água naturais",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 82,
    grupo: "app_e_uso_restrito",
    order: 47,
    id: "reservatorio_geracao_energia_ate_24_08_2001",
    name: "Reservatório de geração de energia elétrica construído até 24/08/2001",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 35,
    grupo: "app_e_uso_restrito",
    order: 48,
    id: "restinga",
    name: "Restinga",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 18,
    grupo: "app_e_uso_restrito",
    order: 49,
    id: "vereda",
    name: "Vereda",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 32,
    grupo: "reserva_legal",
    order: 1,
    id: "arl_total",
    name: "Área de Reserva Legal Total",
    tipo_tema: "mult",
    editable: false,
    required: false
  },
  {
    tema_id: 25,
    grupo: "reserva_legal",
    order: 2,
    id: "arl_aprovada_nao_averbada",
    name: "Reserva Legal Aprovada e não Averbada",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 24,
    grupo: "reserva_legal",
    order: 3,
    id: "arl_averbada",
    name: "Reserva Legal Averbada",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 23,
    grupo: "reserva_legal",
    order: 4,
    id: "arl_proposta",
    name: "Reserva Legal Proposta",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: 80,
    grupo: "reserva_legal",
    order: 5,
    id: "arl_averbada_outro_imovel",
    name: "Reserva Legal vinculada à compensação de outro imóvel",
    tipo_tema: "mult",
    editable: true,
    required: false
  },
  {
    tema_id: null,
    grupo: null,
    order: null,
    id: "hydrography",
    name: "Hidrografia",
    tipo_tema: null,
    editable: false,
    required: false,
  },
  {
    tema_id: null,
    grupo: null,
    order: null,
    id: "anthropizedAfter2008",
    name: "Área Antropizada após 2008",
    tipo_tema: null,
    editable: false,
    required: false,
  },
];

// preencha dinamicamente as opções para cada grupo
export const GROUP_LAYER = BASE_GROUP_LAYER.map(group => {
  // Filtrar LAYER_TYPES para obter apenas itens que pertencem a este grupo
  const groupOptions = LAYER_TYPES.filter(layer => layer.grupo === group.id)
    // Classificar pela propriedade de order para manter a ordem pretendida
    .sort((a, b) => a.order - b.order)
    // Mapeie para o formato que você deseja para opções
    .map(layer => ({
      id: layer.id,
      name: layer.name,
      tema_id: layer.tema_id,
      tipo_tema: layer.tipo_tema,
      editable: layer.editable,
      required: layer.required
    }));

  // Retornar o grupo com opções preenchidas
  return {
    ...group,
    options: groupOptions
  };
});

export default {
  LAYER_TYPES,
  GROUP_LAYER,
};
