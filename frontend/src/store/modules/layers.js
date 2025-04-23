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
        if (area !== undefined) {
          layer.area = area;
        }
      }
    },
  },
  actions: {
    selectLayer({ commit, state, rootState, dispatch }, layerId) {
      // Verificar se existe o layerId
      const layerType = state.layerTypes.find((lt) => lt.id === layerId);
      if (!layerType) {
        console.error(`Tipo de camada inválido: ${layerId}`);
        return false;
      }

      // Verificar se a camada "Área do imóvel" já foi definida
      const area_imovelDefined = state.layers.some(
        (l) => l.id === "area_imovel"
      );

      // Se não for a camada "Área do imóvel" e ela ainda não estiver definida, impedir a seleção
      if (layerId !== "area_imovel" && !area_imovelDefined) {
        dispatch(
          "validation/addAlert",
          {
            type: "error",
            message:
              "É necessário definir a Área do imóvel antes de outras camadas.",
          },
          { root: true }
        );
        return false;
      }

      // Se quiser selecionar a camada "Área do imóvel" e ela já estiver definida, impedir a seleção
      if (layerId === "area_imovel" && area_imovelDefined) {
        dispatch(
          "validation/addAlert",
          {
            type: "info",
            message:
              "A Área do imóvel já foi definida. Para modificá-la, use a ferramenta de exclusão primeiro.",
          },
          { root: true }
        );
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
        dispatch(
          "validation/addAlert",
          {
            type: "error",
            message: validationResult.message,
          },
          { root: true }
        );
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
      try {
        // Primeiro, verifica se é a área do imóvel
        if (layerId === "area_imovel") {
          // Limpa todas as camadas no mapa antes de remover do estado
          state.layers.forEach(layer => {
            // Use um serviço ou método para limpar cada camada no mapa
            dispatch('clearLayerGraphics', layer.id, { root: false });
          });
          
          // Remove todas as camadas do estado
          commit("REMOVE_ALL_LAYERS");
          
          // Certifica-se de que não há camada selecionada
          commit("SET_SELECTED_LAYER", null);
          
          return {
            success: true,
            message: "Todas as camadas foram removidas pois a Área do imóvel foi excluída."
          };
        } else {
          // Limpa a camada específica no mapa
          dispatch('clearLayerGraphics', layerId, { root: false });
          
          // Remove a camada do estado
          commit("REMOVE_LAYER", layerId);
          
          // Se a camada removida for a selecionada atualmente, limpe a seleção
          if (state.selectedLayer === layerId) {
            commit("SET_SELECTED_LAYER", null);
          }
          
          // Recalcular área antropizada após 2008
          dispatch("property/calculateAnthropizedAfter2008", null, { root: true });
          
          return { success: true };
        }
      } catch (error) {
        console.error("Erro ao remover camada:", error);
        return { 
          success: false, 
          message: "Ocorreu um erro ao remover a camada."
        };
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
              message:
                "Por favor, selecione um município antes de desenhar a área do imóvel.",
            };
          }

          console.log("Validando geometria do imóvel:", geometry);
          console.log("Contra município:", municipalityGeometry);

          // Validar interseção da área com o município
          const municipalityValidation =
            arcgisService.validateIntersectsWithMunicipality(
              geometry,
              municipalityGeometry
            );

          console.log("Resultado da interseção:", municipalityValidation);

          if (!municipalityValidation) {
            return {
              success: false,
              message:
                "A área do imóvel deve intersectar o município selecionado.",
            };
          }

          // Validar se pelo menos 50% da área está dentro do município
          const minimumAreaInMunicipality =
            arcgisService.validateMinimumAreaInMunicipality(
              geometry,
              municipalityGeometry,
              50
            );

          console.log(
            "Resultado da validação de área mínima:",
            minimumAreaInMunicipality
          );

          if (!minimumAreaInMunicipality) {
            return {
              success: false,
              message:
                "No mínimo 50% da área do imóvel deve estar dentro do município selecionado.",
            };
          }

          // Assumimos que todos os municípios estão em São Paulo neste contexto
          return { success: true };
        }

        case "sede_imovel": {
          // Verificar se a sede está dentro da área do imóvel
          const area_imovel = state.layers.find((l) => l.id === "area_imovel");
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
          const area_imovel = state.layers.find((l) => l.id === "area_imovel");
          if (!area_imovel || !area_imovel.geometry) {
            return {
              success: false,
              message: "A área do imóvel precisa ser definida primeiro.",
            };
          }

          const isInsideProperty = arcgisService.isWithin(
            geometry,
            area_imovel.geometry
          );

          if (!isInsideProperty) {
            return {
              success: false,
              message:
                "A vegetação nativa deve estar dentro da área do imóvel.",
            };
          }

          // Verificar sobreposições não permitidas
          const area_consolidada = state.layers.find(
            (l) => l.id === "area_consolidada"
          );
          const servitudeAreas = state.layers.filter(
            (l) => l.id === "area_servidao_administrativa_total"
          );
          const hydrographyAreas = state.layers.filter(
            (l) => l.id === "hydrography"
          );

          if (area_consolidada && area_consolidada.geometry) {
            const overlapsConsolidated = arcgisService.intersects(
              geometry,
              area_consolidada.geometry
            );
            if (overlapsConsolidated) {
              return {
                success: false,
                message:
                  "A vegetação nativa não pode sobrepor áreas consolidadas.",
              };
            }
          }

          for (const servitude of servitudeAreas) {
            if (arcgisService.intersects(geometry, servitude.geometry)) {
              return {
                success: false,
                message:
                  "A vegetação nativa não pode sobrepor servidões administrativas.",
              };
            }
          }

          for (const hydro of hydrographyAreas) {
            if (arcgisService.intersects(geometry, hydro.geometry)) {
              return {
                success: false,
                message:
                  "A vegetação nativa não pode sobrepor áreas de hidrografia.",
              };
            }
          }

          return { success: true };
        }

        case "area_pousio": {
          // Verificar se está dentro da área do imóvel
          const area_imovel = state.layers.find((l) => l.id === "area_imovel");
          if (!area_imovel || !area_imovel.geometry) {
            return {
              success: false,
              message: "A área do imóvel precisa ser definida primeiro.",
            };
          }

          const isInsideProperty = arcgisService.isWithin(
            geometry,
            area_imovel.geometry
          );

          if (!isInsideProperty) {
            return {
              success: false,
              message: "A área de pousio deve estar dentro da área do imóvel.",
            };
          }

          return { success: true };
        }

        case "area_consolidada": {
          // Verificar se está dentro da área do imóvel
          const area_imovel = state.layers.find((l) => l.id === "area_imovel");
          if (!area_imovel || !area_imovel.geometry) {
            return {
              success: false,
              message: "A área do imóvel precisa ser definida primeiro.",
            };
          }

          const isInsideProperty = arcgisService.isWithin(
            geometry,
            area_imovel.geometry
          );

          if (!isInsideProperty) {
            return {
              success: false,
              message:
                "A área consolidada deve estar dentro da área do imóvel.",
            };
          }

          // Verificar sobreposição com vegetação nativa
          const vegetacao_nativa = state.layers.find(
            (l) => l.id === "vegetacao_nativa"
          );
          if (vegetacao_nativa && vegetacao_nativa.geometry) {
            const overlapsVegetation = arcgisService.intersects(
              geometry,
              vegetacao_nativa.geometry
            );
            if (overlapsVegetation) {
              return {
                success: false,
                message:
                  "A área consolidada não pode sobrepor áreas de vegetação nativa.",
              };
            }
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

    clearLayerGraphics({ commit }, layerId) {
      // Use o serviço do ArcGIS para limpar a camada
      if (window.arcgisService) {
        window.arcgisService.clearLayer(layerId);
      }
    },

    /**
     * Atualiza a geometria de uma camada existente
     */
    async updateLayerGeometry({ commit, dispatch }, { layerId, geometry }) {
      try {
        // Verificar se a camada existe
        const layer = this.state.layers.layers.find((l) => l.id === layerId);
        if (!layer) {
          throw new Error(`Camada ${layerId} não encontrada.`);
        }

        // Validar a geometria atualizada
        const validationResult = await dispatch("validateLayerGeometry", {
          layerId,
          geometry,
        });

        if (!validationResult.success) {
          dispatch(
            "validation/addAlert",
            {
              type: "error",
              message: validationResult.message,
            },
            { root: true }
          );
          return false;
        }

        // Calcular a área da geometria atualizada
        const area = await dispatch("calculateArea", geometry);

        // Atualizar a camada no estado
        commit("UPDATE_LAYER_GEOMETRY", { layerId, geometry, area });

        // Se for a área do imóvel, recalcular a área líquida
        if (layerId === "area_imovel") {
          dispatch("property/calculateNetarea_imovel", null, { root: true });
        }

        // Recalcular área antropizada após 2008
        dispatch("property/calculateAnthropizedAfter2008", null, {
          root: true,
        });

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

        // Atualizar o gráfico no mapa
        this._vm.$arcgisService.clearLayer(layerId);
        this._vm.$arcgisService.addGraphic(layerId, geometry);

        return true;
      } catch (error) {
        console.error("Erro ao atualizar geometria:", error);
        dispatch(
          "validation/addAlert",
          {
            type: "error",
            message: `Erro ao atualizar geometria: ${
              error.message || "Erro desconhecido"
            }`,
          },
          { root: true }
        );
        return false;
      }
    },

    /**
     * Importa geometria de arquivo para uma camada
     */
    async importGeometryFromFile({ dispatch }, { layerId, file }) {
      try {
        // Verificar se a camada existe
        const layer = this.state.layers.layers.find((l) => l.id === layerId);
        if (!layer) {
          throw new Error(`Camada ${layerId} não encontrada.`);
        }

        // Importar a geometria do arquivo
        const geometry = await this._vm.$arcgisService.importGeometryFromFile(
          file
        );

        if (!geometry) {
          throw new Error("Não foi possível importar a geometria do arquivo.");
        }

        // Adicionar a geometria como uma nova camada
        return await dispatch("addLayer", {
          layerId,
          geometry,
        });
      } catch (error) {
        console.error("Erro ao importar geometria:", error);
        dispatch(
          "validation/addAlert",
          {
            type: "error",
            message: `Erro ao importar geometria: ${
              error.message || "Erro desconhecido"
            }`,
          },
          { root: true }
        );
        return false;
      }
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
      const area_imovelDefined = state.layers.some(
        (l) => l.id === "area_imovel"
      );

      // Retorna os grupos de camadas com suas opções filtradas
      return state.baseGroupLayers
        .map((group) => {
          // Filtrar opções do grupo com base no estado da área do imóvel
          let filteredOptions = group.options;

          // Se a área do imóvel não estiver definida e não for o grupo "imovel"
          // Retornar o grupo com opções vazias
          if (!area_imovelDefined && group.id !== "imovel") {
            filteredOptions = [];
          } else if (area_imovelDefined && group.id === "imovel") {
            // Se a área do imóvel já estiver definida e for o grupo "imovel"
            // Filtrar para remover a camada "area_imovel" das opções
            filteredOptions = group.options.filter(
              (option) => option.id !== "area_imovel"
            );
          }

          // Filtrar também por editable = true para mostrar apenas camadas editáveis
          filteredOptions = filteredOptions.filter((option) => option.editable);

          return {
            ...group,
            options: filteredOptions,
          };
        })
        .filter((group) => group.options.length > 0); // Remover grupos sem opções
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

    // Obtém o grupo ao qual pertence uma camada
    getLayerGroup: (state) => (layerId) => {
      for (const group of state.baseGroupLayers) {
        const layerInGroup = group.options.find(
          (option) => option.id === layerId
        );
        if (layerInGroup) {
          return group.id;
        }
      }
      return null;
    },
  },
};
