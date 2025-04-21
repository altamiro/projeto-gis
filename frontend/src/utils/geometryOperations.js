import arcgisService from '../services/arcgis';

export default {
  /**
   * Recorta uma geometria com base em uma geometria de corte
   * @param {Object} targetGeometry - Geometria a ser recortada
   * @param {Object} clipGeometry - Geometria usada para o recorte
   * @returns {Object} Geometria resultante após o recorte
   */
  clipGeometry(targetGeometry, clipGeometry) {
    return arcgisService.difference(targetGeometry, clipGeometry);
  },
  
  /**
   * Recorta uma geometria com base em múltiplas geometrias de corte
   * @param {Object} targetGeometry - Geometria a ser recortada
   * @param {Array} clipGeometries - Array de geometrias usadas para o recorte
   * @returns {Object} Geometria resultante após todos os recortes
   */
  clipGeometryWithMultiple(targetGeometry, clipGeometries) {
    let resultGeometry = targetGeometry;
    
    for (const clipGeometry of clipGeometries) {
      resultGeometry = this.clipGeometry(resultGeometry, clipGeometry);
      
      // Se não sobrou nada após o recorte, retornar null
      if (!resultGeometry) {
        return null;
      }
    }
    
    return resultGeometry;
  },
  
  /**
   * Verifica se uma geometria está completamente contida em outra
   * @param {Object} innerGeometry - Geometria que deve estar contida
   * @param {Object} outerGeometry - Geometria contenedora
   * @returns {Boolean} True se innerGeometry está completamente dentro de outerGeometry
   */
  isGeometryWithin(innerGeometry, outerGeometry) {
    return arcgisService.geometryEngine.within(innerGeometry, outerGeometry);
  },
  
  /**
   * Calcula a área de interseção entre duas geometrias
   * @param {Object} geometry1 - Primeira geometria
   * @param {Object} geometry2 - Segunda geometria
   * @returns {Number} Área da interseção em hectares
   */
  calculateIntersectionArea(geometry1, geometry2) {
    const intersection = arcgisService.intersection(geometry1, geometry2);
    
    if (!intersection) {
      return 0;
    }
    
    return arcgisService.calculateArea(intersection);
  }
};