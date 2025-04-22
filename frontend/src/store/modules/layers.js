import arcgisService from "../../services/arcgis";
import { GROUP_LAYER, LAYER_TYPES } from "../../utils/constants_layers";

export default {
  namespaced: true,
  state: {
    layers: [],
    selectedLayer: null,
    drawingMode: false,
    layerTypes: LAYER_TYPES,
    baseGroupLayers: GROUP_LAYER,
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
      const area_imovelDefined = state.layers.some(
        (l) => l.id === "area_imovel"
      );

      // Se não for a camada "Área do imóvel" e ela ainda não estiver definida, impedir a seleção
      if (layerId !== "area_imovel" && !area_imovelDefined) {
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
      if (layerId === "area_imovel") {
        dispatch("property/calculateNetarea_imovel", null, { root: true });
      }

      // Recalcular área antropizada após 2008
      dispatch("property/calculateAnthropizedAfter2008", null, { root: true });

      // Se necessário, recortar outras camadas
      if (
        [
          "area_imovel",
          "vegetacao_nativa",
          "area_consolidada",
          "area_servidao_administrativa_total",
          "hydrography",
        ].includes(layerId)
      ) {
        dispatch("clipOverlappingLayers", layerId);
      }

      return { success: true };
    },
    removeLayer({ commit, dispatch, state }, layerId) {
      if (layerId === "area_imovel") {
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
      // Utilizar o serviço ArcGIS para calcular área
      return arcgisService.calculateArea(geometry);
    },
    async validateLayerGeometry({ state, rootState }, { layerId, geometry }) {
      // Implementação de validação usando operações geométricas do ArcGIS

      // Validações específicas por tipo de camada
      switch (layerId) {
        case "area_imovel": {
          // Obter a geometria do município selecionado
          const municipalityGeometry = rootState.property.municipalityGeometry;
          
          if (!municipalityGeometry) {
            return {
              success: false,
              message: "Por favor, selecione um município antes de desenhar a área do imóvel."
            };
          }

          console.log("Validando geometria do imóvel:", geometry);
          console.log("Contra município:", municipalityGeometry);

          // Validar interseção da área com o município
          const municipalityValidation = arcgisService.validateIntersectsWithMunicipality(
            geometry,
            municipalityGeometry
          );
          
          console.log("Resultado da interseção:", municipalityValidation);

          if (!municipalityValidation) {
            return {
              success: false,
              message: "A área do imóvel deve intersectar o município selecionado.",
            };
          }

          // Validar se pelo menos 50% da área está dentro do município
          const minimumAreaInMunicipality = arcgisService.validateMinimumAreaInMunicipality(
            geometry,
            municipalityGeometry,
            50
          );
          
          console.log("Resultado da validação de área mínima:", minimumAreaInMunicipality);

          if (!minimumAreaInMunicipality) {
            return {
              success: false,
              message: "No mínimo 50% da área do imóvel deve estar dentro do município selecionado.",
            };
          }

          // Assumimos que todos os municípios estão em São Paulo neste contexto
          return { success: true };
        }

        case "sede_imovel": {
          // Verificar se a sede está dentro da área do imóvel
          const area_imovel = state.layers.find(
            (l) => l.id === "area_imovel"
          );
          if (!area_imovel || !area_imovel.geometry) {
            return {
              success: false,
              message: "A área do imóvel precisa ser definida primeiro.",
            };
          }

          // Verificar se está dentro usando o ArcGIS
          const isInsideProperty = arcgisService.isWithin(
            geometry,
            area_imovel.geometry
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

        case "vegetacao_nativa": {
          // Verificar se está dentro da área do imóvel
          const area_imovel = state.layers.find(l => l.id === "area_imovel");
          if (!area_imovel || !area_imovel.geometry) {
            return {
              success: false,
              message: "A área do imóvel precisa ser definida primeiro."
            };
          }
          
          const isInsideProperty = arcgisService.isWithin(geometry, area_imovel.geometry);
          
          if (!isInsideProperty) {
            return {
              success: false,
              message: "A vegetação nativa deve estar dentro da área do imóvel."
            };
          }

          // Verificar sobreposições não permitidas
          const area_consolidada = state.layers.find(l => l.id === "area_consolidada");
          const servitudeAreas = state.layers.filter(l => l.id === "area_servidao_administrativa_total");
          const hydrographyAreas = state.layers.filter(l => l.id === "hydrography");
          
          if (area_consolidada && area_consolidada.geometry) {
            const overlapsConsolidated = arcgisService.intersects(geometry, area_consolidada.geometry);
            if (overlapsConsolidated) {
              return {
                success: false,
                message: "A vegetação nativa não pode sobrepor áreas consolidadas."
              };
            }
          }
          
          for (const servitude of servitudeAreas) {
            if (arcgisService.intersects(geometry, servitude.geometry)) {
              return {
                success: false,
                message: "A vegetação nativa não pode sobrepor servidões administrativas."
              };
            }
          }
          
          for (const hydro of hydrographyAreas) {
            if (arcgisService.intersects(geometry, hydro.geometry)) {
              return {
                success: false,
                message: "A vegetação nativa não pode sobrepor áreas de hidrografia."
              };
            }
          }

          return { success: true };
        }

        case "area_pousio": {
          // Verificar se está dentro da área do imóvel
          const area_imovel = state.layers.find(l => l.id === "area_imovel");
          if (!area_imovel || !area_imovel.geometry) {
            return {
              success: false,
              message: "A área do imóvel precisa ser definida primeiro."
            };
          }
          
          const isInsideProperty = arcgisService.isWithin(geometry, area_imovel.geometry);
          
          if (!isInsideProperty) {
            return {
              success: false,
              message: "A área de pousio deve estar dentro da área do imóvel."
            };
          }

          return { success: true };
        }

        default:
          return { success: true };
      }
    },
    clipOverlappingLayers({ state, commit, dispatch }) {
      // Implementação da lógica de recorte
      console.log("Recortando camadas sobrepostas...");

      // Recálculo da área antropizada após as operações de recorte
      dispatch("property/calculateAnthropizedAfter2008", null, { root: true });
    },
  },
  getters: {
    availableLayers(state) {
      // Retorna os tipos de camadas disponíveis com base no estado atual
      const area_imovelDefined = state.layers.some(
        (l) => l.id === "area_imovel"
      );

      return state.layerTypes.filter((layerType) => {
        // Se a área do imóvel não estiver definida, mostrar apenas essa opção
        if (!area_imovelDefined) {
          return layerType.id === "area_imovel";
        }

        // Caso contrário, mostrar todas as camadas editáveis
        return layerType.editable;
      });
    },
    availableBaseGroupLayers(state) {
      return state.baseGroupLayers;
    },
    isPropertyFullyCovered(state) {
      // Verificar se toda a área do imóvel está coberta por pelo menos uma camada
      const layers = state.layers;
      const propertyLayer = layers.find((l) => l.id === "area_imovel");

      if (!propertyLayer) return false;

      const coveredArea = layers
        .filter((l) =>
          [
            "area_consolidada",
            "vegetacao_nativa",
            "area_pousio",
            "anthropizedAfter2008",
          ].includes(l.id)
        )
        .reduce((sum, layer) => sum + (layer.area || 0), 0);

      // Considerar uma pequena margem de erro para arredondamentos
      return Math.abs(propertyLayer.area - coveredArea) < 0.01;
    },
  },
};