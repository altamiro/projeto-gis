import arcgisService from '../services/arcgis';

export default {
  /**
   * Calcula a área líquida do imóvel (área total menos servidões administrativas)
   * @param {Object} propertyGeometry - Geometria da área do imóvel
   * @param {Array} servitudeGeometries - Array de geometrias das servidões administrativas
   * @returns {Number} Área líquida em hectares
   */
  calculateNetarea_imovel(propertyGeometry, servitudeGeometries) {
    // Calcular área total do imóvel
    const totalArea = arcgisService.calculateArea(propertyGeometry);
    
    // Somar áreas de servidão
    let servitudeArea = 0;
    
    for (const servitude of servitudeGeometries) {
      // Calcular interseção com a área do imóvel
      const intersection = arcgisService.intersection(propertyGeometry, servitude);
      
      if (intersection) {
        servitudeArea += arcgisService.calculateArea(intersection);
      }
    }
    
    // Calcular área líquida
    return totalArea - servitudeArea;
  },
  
  /**
   * Calcula a área antropizada após 2008
   * @param {Object} propertyGeometry - Geometria da área do imóvel
   * @param {Object} consolidatedGeometry - Geometria da área consolidada
   * @param {Object} vegetationGeometry - Geometria da vegetação nativa
   * @param {Array} servitudeGeometries - Array de geometrias das servidões administrativas
   * @param {Array} hydrographyGeometries - Array de geometrias das hidrografias
   * @returns {Number} Área antropizada após 2008 em hectares
   */
  calculateAnthropizedAfter2008(
    propertyGeometry, 
    consolidatedGeometry, 
    vegetationGeometry, 
    servitudeGeometries,
    hydrographyGeometries
  ) {
    // Calcular área total do imóvel
    const totalArea = arcgisService.calculateArea(propertyGeometry);
    
    // Calcular áreas das demais camadas (considerando apenas interseções com a área do imóvel)
    
    // Área consolidada
    let area_consolidada = 0;
    if (consolidatedGeometry) {
      const intersection = arcgisService.intersection(propertyGeometry, consolidatedGeometry);
      if (intersection) {
        area_consolidada = arcgisService.calculateArea(intersection);
      }
    }
    
    // Vegetação nativa
    let vegetationArea = 0;
    if (vegetationGeometry) {
      const intersection = arcgisService.intersection(propertyGeometry, vegetationGeometry);
      if (intersection) {
        vegetationArea = arcgisService.calculateArea(intersection);
      }
    }
    
    // Servidões administrativas
    let servitudeArea = 0;
    for (const servitude of servitudeGeometries) {
      const intersection = arcgisService.intersection(propertyGeometry, servitude);
      if (intersection) {
        servitudeArea += arcgisService.calculateArea(intersection);
      }
    }
    
    // Hidrografias
    let hydrographyArea = 0;
    for (const hydrography of hydrographyGeometries) {
      const intersection = arcgisService.intersection(propertyGeometry, hydrography);
      if (intersection) {
        hydrographyArea += arcgisService.calculateArea(intersection);
      }
    }
    
    // Calcular área antropizada após 2008
    const anthropizedAfter2008 = totalArea - (area_consolidada + vegetationArea + servitudeArea + hydrographyArea);
    
    // Garantir que não seja negativo (pode ocorrer por arredondamentos ou imprecisões)
    return Math.max(0, anthropizedAfter2008);
  },
  
  /**
   * Verifica se a área do imóvel está completamente coberta
   * @param {Object} propertyGeometry - Geometria da área do imóvel
   * @param {Array} coverageGeometries - Array de geometrias das camadas de cobertura
   * @returns {Boolean} True se a área estiver completamente coberta
   */
  isPropertyFullyCovered(propertyGeometry, coverageGeometries) {
    // Unir todas as geometrias de cobertura
    let unionGeometry = null;
    
    for (const geometry of coverageGeometries) {
      if (!unionGeometry) {
        unionGeometry = geometry;
      } else {
        unionGeometry = arcgisService.geometryEngine.union([unionGeometry, geometry]);
      }
    }
    
    if (!unionGeometry) {
      return false;
    }
    
    // Calcular diferença entre a área do imóvel e a união das coberturas
    const difference = arcgisService.difference(propertyGeometry, unionGeometry);
    
    // Se não houver diferença, a área está completamente coberta
    if (!difference) {
      return true;
    }
    
    // Calcular área da diferença
    const differenceArea = arcgisService.calculateArea(difference);
    
    // Considerar completamente coberta se a área descoberta for menor que um limiar
    const threshold = 0.01; // 0.01 hectares = 100m²
    return differenceArea < threshold;
  }
};