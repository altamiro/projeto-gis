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
      fill: [255, 255, 255, 0.2],
      outline: [0, 0, 0, 1]
    },
    
    // Sede do imóvel
    sede_imovel: {
      fill: [255, 0, 0, 1],
      outline: [0, 0, 0, 1]
    },
    
    // Área consolidada
    area_consolidada: {
      fill: [245, 166, 35, 0.6],
      outline: [245, 166, 35, 1]
    },
    
    // Vegetação nativa
    vegetacao_nativa: {
      fill: [60, 179, 113, 0.6],
      outline: [60, 179, 113, 1]
    },
    
    // Área de pousio
    area_pousio: {
      fill: [255, 255, 0, 0.6],
      outline: [255, 255, 0, 1]
    },
    
    // Servidão administrativa
    area_servidao_administrativa_total: {
      fill: [128, 0, 128, 0.6],
      outline: [128, 0, 128, 1]
    },
    
    // Hidrografia
    hydrography: {
      fill: [0, 191, 255, 0.6],
      outline: [0, 191, 255, 1]
    },
    
    // Área antropizada após 2008
    anthropizedAfter2008: {
      fill: [255, 0, 0, 0.6],
      outline: [255, 0, 0, 1]
    }
  }
};