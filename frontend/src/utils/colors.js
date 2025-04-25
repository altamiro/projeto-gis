// Versão JavaScript das cores definidas em SCSS
// Usado principalmente pelo ArcGIS SDK que não tem acesso direto às variáveis SCSS

export default {
  // Cores principais
  primary: '#409EFF',
  success: '#67C23A',
  warning: '#E6A23C',
  danger: '#F56C6C',
  info: '#909399',
  
  // Cores das camadas
  layers: {
    // Área do imóvel
    area_imovel: {
      fill: '#FFFFFF33',
      outline: '#000000FF'
    },

    // Sede do imóvel
    sede_imovel: {
      fill: '#FF0000FF',
      outline: '#000000FF'
    },

    // Área consolidada
    area_consolidada: {
      fill: '#F5A62399',
      outline: '#F5A623FF'
    },

    // Vegetação nativa
    vegetacao_nativa: {
      fill: '#3CB37199',
      outline: '#3CB371FF'
    },

    // Área de pousio
    area_pousio: {
      fill: '#FFFF0099',
      outline: '#FFFF00FF' 
    },

    // Servidão administrativa
    area_servidao_administrativa_total: {
      fill: '#80008099',
      outline: '#800080FF'
    },

    // Hidrografia
    hydrography: {
      fill: '#00BFFF99',
      outline: '#00BFFFFF'
    },

    // Área antropizada após 2008
    area_antropizada_apos_2008_vetorizada: {
      fill: '#FF000099',
      outline: '#FF0000FF'
    }
  }
};