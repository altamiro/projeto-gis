import arcgisService from "./arcgis";

export default {
  /**
   * Valida se a geometria do imóvel intersecta o município declarado
   * @param {Object} geometry - Geometria da área do imóvel
   * @param {Object} municipalityGeometry - Geometria do município
   * @returns {Object} Resultado da validação
   */
  validatePropertyIntersectsMunicipality(geometry, municipalityGeometry) {
    try {
      if (!municipalityGeometry) {
        return {
          success: false,
          message:
            "É necessário selecionar um município antes de desenhar a área do imóvel.",
        };
      }

      // Verificar interseção
      const intersects = arcgisService.intersects(
        geometry,
        municipalityGeometry
      );

      return {
        success: intersects,
        message: intersects
          ? null
          : "A área do imóvel deve intersectar o município selecionado.",
      };
    } catch (error) {
      console.error("Erro ao validar interseção com município:", error);
      return {
        success: false,
        message: "Não foi possível validar a interseção com o município.",
      };
    }
  },

  /**
   * Valida se a maior parte da área do imóvel está em São Paulo
   * @param {Object} geometry - Geometria da área do imóvel
   * @returns {Promise<Object>} Resultado da validação
   */
  async validatePropertyInSaoPaulo(geometry) {
    try {
      // Em uma aplicação real, isso buscaria a geometria do estado em um serviço
      const spGeometry = await this.getStateGeometry("São Paulo");

      // Calcular a interseção
      const intersection = arcgisService.intersection(geometry, spGeometry);

      if (!intersection) {
        return {
          success: false,
          message:
            "A área do imóvel deve estar, ao menos parcialmente, no estado de São Paulo.",
        };
      }

      // Calcular as áreas
      const totalArea = arcgisService.calculateArea(geometry);
      const intersectionArea = arcgisService.calculateArea(intersection);

      // Verificar se mais de 50% está em SP
      const isMainlyInSP = intersectionArea > totalArea / 2;

      return {
        success: isMainlyInSP,
        message: isMainlyInSP
          ? null
          : "A maior parte da área do imóvel deve estar dentro do estado de São Paulo.",
      };
    } catch (error) {
      console.error("Erro ao validar localização em São Paulo:", error);
      return {
        success: false,
        message: "Não foi possível validar a localização em São Paulo.",
      };
    }
  },

  /**
   * Valida se a geometria está dentro da área do imóvel
   * @param {Object} geometry - Geometria a ser validada
   * @param {Object} propertyGeometry - Geometria da área do imóvel
   * @returns {Object} Resultado da validação
   */
  validateGeometryInsideProperty(geometry, propertyGeometry) {
    if (!propertyGeometry) {
      return {
        success: false,
        message: "É necessário definir a área do imóvel primeiro.",
      };
    }

    // Verificar se a geometria está completamente contida na área do imóvel
    const isInside = arcgisService.isWithin(geometry, propertyGeometry);

    return {
      success: isInside,
      message: isInside
        ? null
        : "A geometria deve estar completamente dentro da área do imóvel.",
    };
  },

  /**
   * Valida se a geometria não sobrepõe camadas proibidas
   * @param {Object} geometry - Geometria a ser validada
   * @param {Array} forbiddenLayers - Array de geometrias que não podem ser sobrepostas
   * @returns {Object} Resultado da validação
   */
  validateNoOverlap(geometry, forbiddenLayers) {
    for (const layer of forbiddenLayers) {
      if (arcgisService.intersects(geometry, layer.geometry)) {
        return {
          success: false,
          message: `A geometria não pode sobrepor a camada "${layer.name}".`,
        };
      }
    }

    return {
      success: true,
      message: null,
    };
  },

  // Simulações para a aplicação de exemplo
  async getMunicipalityGeometry(municipalityName) {
    // Simulação - em uma aplicação real, isso buscaria dados de um serviço
    console.log(`Buscando geometria do município: ${municipalityName}`);
    return null; // Retornaria a geometria real do município
  },

  async getStateGeometry(stateName) {
    // Simulação - em uma aplicação real, isso buscaria dados de um serviço
    console.log(`Buscando geometria do estado: ${stateName}`);
    return null; // Retornaria a geometria real do estado
  },
};
