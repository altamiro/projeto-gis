import httpService from "../utils/httpService";

/**
 * Serviço para gerenciamento de camadas geográficas
 */
class LayersService {
  /**
   * Construtor do serviço
   */
  constructor() {
    this.basePath = "/car-online/api/camadas";
  }

  /**
   * Salva as camadas desenhadas no servidor
   * @param {Object} data - Dados das camadas no formato GeoJSON + metadados
   * @returns {Promise} Promessa com a resposta do servidor
   */
  saveAllLayers(data) {
    // Verificar se é necessário processar o payload para garantir o formato correto
    if (data && data.geoJson && data.geoJson.features) {
      for (const feature of data.geoJson.features) {
        // Garantir que as propriedades estejam no formato esperado
        if (feature.properties) {
          // Se não existirem as propriedades necessárias, garantir sua presença
          if (!feature.properties.nomTema && feature.properties.name) {
            feature.properties.nomTema = feature.properties.name;
          }

          if (!feature.properties.codTema && feature.properties.id) {
            feature.properties.codTema = feature.properties.id;
          }

          if (!feature.properties.numArea && feature.properties.area) {
            feature.properties.numArea = feature.properties.area;
          }

          if (!feature.properties.theGeom) {
            feature.properties.theGeom = JSON.stringify(feature.geometry);
          }

          if (!feature.properties.dataCriacao) {
            feature.properties.dataCriacao =
              feature.properties.timestamp || new Date().toISOString();
          }

          if (!feature.properties.dataUltimaAtualizacao) {
            feature.properties.dataUltimaAtualizacao = new Date().toISOString();
          }
        }
      }
    }

    return httpService.post(`${this.basePath}/salvar`, data);
  }

  /**
   * Carrega camadas salvas anteriormente
   * @param {String} municipalityId - ID do município
   * @returns {Promise} Promessa com as camadas carregadas
   */
  loadLayers(municipalityId) {
    return httpService.get(`${this.basePath}/carregar`, { municipalityId });
  }

  /**
   * Exporta as camadas em formato específico
   * @param {Object} options - Opções de exportação
   * @param {String} options.format - Formato de exportação (geojson, shp, kml)
   * @param {String} options.municipalityId - ID do município
   * @returns {Promise} Promessa com o arquivo para download
   */
  exportLayers(options) {
    return httpService.download(`${this.basePath}/exportar`, options);
  }

  /**
   * Exclui camadas salvas no servidor
   * @param {String} municipalityId - ID do município
   * @returns {Promise} Promessa com a resposta do servidor
   */
  deleteLayers(municipalityId) {
    return httpService.delete(`${this.basePath}/excluir`, {
      params: { municipalityId },
    });
  }
}

// Exportar uma instância padrão do serviço
export default new LayersService();
