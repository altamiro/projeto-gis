import arcgisService from "../../services/arcgis";

export default {
  namespaced: true,
  state: {
    layers: [],
    selectedLayer: null,
    drawingMode: false,
    layerTypes: [
      {
        id: "propertyArea",
        name: "Área do imóvel",
        order: 1,
        editable: true,
        required: true,
      },
      {
        id: "headquarters",
        name: "Sede do imóvel",
        order: 2,
        editable: true,
        required: false,
      },
      {
        id: "consolidatedArea",
        name: "Área consolidada",
        order: 3,
        editable: true,
        required: false,
      },
      {
        id: "nativeVegetation",
        name: "Remanescente de vegetação nativa",
        order: 4,
        editable: true,
        required: false,
      },
      {
        id: "fallow",
        name: "Área de pousio",
        order: 5,
        editable: true,
        required: false,
      },
      {
        id: "administrativeServitude",
        name: "Servidão administrativa",
        order: 6,
        editable: true,
        required: false,
      },
      {
        id: "hydrography",
        name: "Hidrografia",
        order: 7,
        editable: false,
        required: false,
      },
      {
        id: "anthropizedAfter2008",
        name: "Área Antropizada após 2008",
        order: 8,
        editable: false,
        required: false,
      },
    ],
  },
  mutations: {
    ADD_LAYER(state, layer) {
      const existingIndex = state.layers.findIndex((l) => l.id === layer.id);
      if (existingIndex >= 0) {
        state.layers.splice(existingIndex, 1, layer);
      } else {
        state.layers.push(layer);
      }
    },
    REMOVE_LAYER(state, layerId) {
      state.layers = state.layers.filter((l) => l.id !== layerId);
    },
    REMOVE_ALL_LAYERS(state) {
      state.layers = [];
    },
    SET_SELECTED_LAYER(state, layerId) {
      state.selectedLayer = layerId;
    },
    SET_DRAWING_MODE(state, mode) {
      state.drawingMode = mode;
    },
    UPDATE_LAYER_GEOMETRY(state, { layerId, geometry, area }) {
      const layer = state.layers.find((l) => l.id === layerId);
      if (layer) {
        layer.geometry = geometry;
        layer.area = area;
      }
    },
  },
  actions: {
    selectLayer({ commit, state, rootState }, layerId) {
      // Verificar se a camada "Área do imóvel" já foi definida
      const propertyAreaDefined = state.layers.some(
        (l) => l.id === "propertyArea"
      );

      // Se não for a camada "Área do imóvel" e ela ainda não estiver definida, impedir a seleção
      if (layerId !== "propertyArea" && !propertyAreaDefined) {
        rootState.validation.alerts.push({
          type: "error",
          message:
            "É necessário definir a Área do imóvel antes de outras camadas.",
        });
        return false;
      }

      commit("SET_SELECTED_LAYER", layerId);
      return true;
    },

    removeAllLayers({ commit, state }) {
      // Limpar todas as camadas no serviço ArcGIS
      state.layers.forEach((layer) => {
        arcgisService.clearLayer(layer.id);
      });

      // Limpar o estado no Vuex
      commit("REMOVE_ALL_LAYERS");

      return { success: true };
    },

    async addLayer(
      { commit, dispatch, state, rootState },
      { layerId, geometry }
    ) {
      const layerType = state.layerTypes.find((lt) => lt.id === layerId);

      if (!layerType) {
        return { success: false, message: "Tipo de camada inválido." };
      }

      // Calcular a área em hectares
      const area = await dispatch("calculateArea", geometry);

      // Validar a geometria com base no tipo de camada
      const validationResult = await dispatch("validateLayerGeometry", {
        layerId,
        geometry,
        area,
      });

      if (!validationResult.success) {
        rootState.validation.alerts.push({
          type: "error",
          message: validationResult.message,
        });
        return validationResult;
      }

      // Se for válida, adicionar a camada
      commit("ADD_LAYER", {
        id: layerId,
        type: layerId,
        name: layerType.name,
        geometry,
        area,
        timestamp: new Date().toISOString(),
      });

      // Se for a área do imóvel, calcular a área líquida
      if (layerId === "propertyArea") {
        dispatch("property/calculateNetPropertyArea", null, { root: true });
      }

      // Recalcular área antropizada após 2008
      dispatch("property/calculateAnthropizedAfter2008", null, { root: true });

      // Se necessário, recortar outras camadas
      if (
        [
          "propertyArea",
          "nativeVegetation",
          "consolidatedArea",
          "administrativeServitude",
          "hydrography",
        ].includes(layerId)
      ) {
        dispatch("clipOverlappingLayers", layerId);
      }

      return { success: true };
    },
    removeLayer({ commit, dispatch, state }, layerId) {
      if (layerId === "propertyArea") {
        // Se a camada for "Área do imóvel", remover todas as camadas
        commit("REMOVE_ALL_LAYERS");
        return {
          success: true,
          message:
            "Todas as camadas foram removidas pois a Área do imóvel foi excluída.",
        };
      } else {
        commit("REMOVE_LAYER", layerId);

        // Recalcular área antropizada após 2008
        dispatch("property/calculateAnthropizedAfter2008", null, {
          root: true,
        });

        return { success: true };
      }
    },
    async calculateArea(_, geometry) {
      // Esta função seria implementada com a API do ArcGIS
      // Simulando o cálculo para o exemplo
      return 10.5; // Área em hectares
    },
    async validateLayerGeometry({ state, rootState }, { layerId, geometry }) {
      // Implementação básica de validação - em produção isso usaria operações geométricas reais do ArcGIS

      // Validações específicas por tipo de camada
      switch (layerId) {
        case "propertyArea": {
          // Obter a geometria do município selecionado
          const municipalityGeometry = rootState.property.municipalityGeometry;

          // Validar que a geometria intersecta o município selecionado
          const municipalityValidation =
            arcgisService.validateIntersectsWithMunicipality(
              geometry,
              municipalityGeometry
            );

          if (!municipalityValidation) {
            return {
              success: false,
              message: `A área do imóvel deve intersectar o município selecionado.`,
            };
          }

          // Garantir que a maior área esteja dentro do estado de São Paulo
          // Isso é simplificado aqui, pois já estamos mostrando apenas municípios de SP
          const isInSaoPaulo = true;

          if (!isInSaoPaulo) {
            return {
              success: false,
              message:
                "A maior parte da área do imóvel deve estar dentro do estado de São Paulo.",
            };
          }

          return { success: true };
        }

        // No caso do headquarters
        case "headquarters": {
          // Verificar se a sede está dentro da área do imóvel
          const propertyArea = state.layers.find(
            (l) => l.id === "propertyArea"
          );
          if (!propertyArea || !propertyArea.geometry) {
            return {
              success: false,
              message: "A área do imóvel precisa ser definida primeiro.",
            };
          }

          // Verificar se está dentro - usando operações reais do ArcGIS
          const isInsideProperty = arcgisService.isWithin(
            geometry,
            propertyArea.geometry
          );

          if (!isInsideProperty) {
            return {
              success: false,
              message: "A sede do imóvel deve estar dentro da área do imóvel.",
            };
          }

          // Verificar se não sobrepõe hidrografia
          const hydrographyLayers = state.layers.filter(
            (l) => l.type === "hydrography"
          );
          let overlapsHydrography = false;

          for (const hydro of hydrographyLayers) {
            if (arcgisService.intersects(geometry, hydro.geometry)) {
              overlapsHydrography = true;
              break;
            }
          }

          if (overlapsHydrography) {
            return {
              success: false,
              message:
                "A sede do imóvel não pode sobrepor áreas de hidrografia.",
            };
          }

          return { success: true };
        }

        case "nativeVegetation": {
          // Verificar se está dentro da área do imóvel
          const isInsideProperty = true; // Simulação

          if (!isInsideProperty) {
            return {
              success: false,
              message:
                "A vegetação nativa deve estar dentro da área do imóvel.",
            };
          }

          // Verificar sobreposições não permitidas
          const overlapsConsolidated = false; // Simulação
          const overlapsServitude = false; // Simulação
          const overlapsHydrography = false; // Simulação

          if (overlapsConsolidated) {
            return {
              success: false,
              message:
                "A vegetação nativa não pode sobrepor áreas consolidadas.",
            };
          }

          if (overlapsServitude) {
            return {
              success: false,
              message:
                "A vegetação nativa não pode sobrepor servidões administrativas.",
            };
          }

          if (overlapsHydrography) {
            return {
              success: false,
              message:
                "A vegetação nativa não pode sobrepor áreas de hidrografia.",
            };
          }

          return { success: true };
        }

        case "fallow": {
          // Verificar se está dentro da área do imóvel
          const isInsideProperty = true; // Simulação

          if (!isInsideProperty) {
            return {
              success: false,
              message: "A área de pousio deve estar dentro da área do imóvel.",
            };
          }

          return { success: true };
        }

        default:
          return { success: true };
      }
    },
    clipOverlappingLayers({ state, commit, dispatch }) {
      // Implementação básica da lógica de recorte
      // Em uma implementação real, isso usaria as operações geométricas do ArcGIS

      // Este é um exemplo simplificado que mostra o conceito
      // As operações reais dependeriam da API do ArcGIS

      console.log("Recortando camadas sobrepostas...");

      // Recálculo da área antropizada após as operações de recorte
      dispatch("property/calculateAnthropizedAfter2008", null, { root: true });
    },
  },
  getters: {
    availableLayers(state) {
      // Retorna os tipos de camadas disponíveis com base no estado atual
      const propertyAreaDefined = state.layers.some(
        (l) => l.id === "propertyArea"
      );

      return state.layerTypes.filter((layerType) => {
        // Se a área do imóvel não estiver definida, mostrar apenas essa opção
        if (!propertyAreaDefined) {
          return layerType.id === "propertyArea";
        }

        // Caso contrário, mostrar todas as camadas editáveis
        return layerType.editable;
      });
    },
    isPropertyFullyCovered(state) {
      // Verificar se toda a área do imóvel está coberta por pelo menos uma camada
      // Esta é uma simplificação - na implementação real seria uma operação geométrica
      const layers = state.layers;
      const propertyLayer = layers.find((l) => l.id === "propertyArea");

      if (!propertyLayer) return false;

      const coveredArea = layers
        .filter((l) =>
          [
            "consolidatedArea",
            "nativeVegetation",
            "fallow",
            "anthropizedAfter2008",
          ].includes(l.id)
        )
        .reduce((sum, layer) => sum + (layer.area || 0), 0);

      // Considerar uma pequena margem de erro para arredondamentos
      return Math.abs(propertyLayer.area - coveredArea) < 0.01;
    },
  },
};
