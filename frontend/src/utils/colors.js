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
      outline: '#DAA520'
    },

    // Sede do imóvel
    sede_imovel: {
      fill: '#F0E68C',
      outline: '#FFFF00'
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
      fill: '#CD5C5C99',
      outline: '#CD5C5CFF' 
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
      fill: '#556B2F99',
      outline: '#556B2FFF'
    }
  }
};