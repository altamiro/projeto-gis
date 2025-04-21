// src/services/arcgis.js - Versão atualizada
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import * as containsOperator from "@arcgis/core/geometry/operators/containsOperator";
import Draw from "@arcgis/core/views/draw/Draw";
import colors from "../utils/colors";

export class ArcGISService {
  constructor() {
    this.map = null;
    this.view = null;
    this.drawTool = null;
    this.layers = {};
    this.tempSymbolState = "default";
    this.municipalityLayer = null;
  }

  initializeMap(container) {
    // Criar o mapa base com satellite explicitamente definido
    this.map = new Map({
      basemap: "satellite"
    });

    // Criar a vista do mapa
    this.view = new MapView({
      container,
      map: this.map,
      center: [-47.0, -23.0], // Centro aproximado do estado de São Paulo
      zoom: 8, // Zoom inicial mais amplo para visualizar o estado de SP
      // Melhorar a qualidade da visualização
      constraints: {
        snapToZoom: false,
        // Limites de zoom para melhorar desempenho e usabilidade
        minZoom: 6,
        maxZoom: 20
      },
      // UI básica para interagir com o mapa
      ui: {
        components: ["zoom", "compass", "attribution"]
      },
      // Melhorar performance da navegação
      navigation: {
        browserTouchPanEnabled: true
      }
    });

    // Inicializar camada de município
    this.municipalityLayer = new GraphicsLayer({
      id: "municipality",
    });
    this.map.add(this.municipalityLayer);

    // Inicializar camadas gráficas para cada tipo de camada
    const layerTypes = [
      "propertyArea",
      "headquarters",
      "consolidatedArea",
      "nativeVegetation",
      "fallow",
      "administrativeServitude",
      "hydrography",
      "anthropizedAfter2008",
      "temp", // Adicionar camada temporária para desenho em tempo real
    ];

    layerTypes.forEach((type) => {
      const layer = new GraphicsLayer({
        id: type,
      });
      this.map.add(layer);
      this.layers[type] = layer;
    });

    // Inicializar a ferramenta de desenho
    this.drawTool = new Draw({
      view: this.view,
    });

    return this.view.when();
  }

  // Método atualizado para exibir geometria do município
  displayMunicipality(municipality) {
    if (!municipality || !municipality.geometry) {
      console.error('Município sem geometria válida');
      return null;
    }

    // Limpar camada do município
    this.municipalityLayer.removeAll();

    try {
      // Converter a geometria GeoJSON para ArcGIS Polygon
      const rings = municipality.geometry.coordinates;
      
      // Importante: usar o sistema de coordenadas WGS84 (4326) para dados GeoJSON
      const polygonGeometry = new Polygon({
        rings: rings,
        spatialReference: { wkid: 4326 } // WGS84 (padrão para GeoJSON)
      });

      // Definir símbolo para o município - transparente no centro com contorno visível
      const municipalitySymbol = {
        type: "simple-fill",
        color: [173, 216, 230, 0.1], // Azul muito claro e quase transparente
        outline: {
          color: [0, 0, 255, 0.8], // Azul mais escuro para o contorno
          width: 2
        }
      };

      // Criar gráfico e adicionar à camada
      const municipalityGraphic = new Graphic({
        geometry: polygonGeometry,
        symbol: municipalitySymbol,
        attributes: {
          id: municipality.id,
          name: municipality.name
        }
      });

      this.municipalityLayer.add(municipalityGraphic);

      // Garantir que o mapa base está definido como satellite
      if (this.map.basemap.id !== "satellite") {
        this.map.basemap = "satellite";
      }

      // Centralizar e dar zoom na geometria do município com animação suave
      this.view.goTo(
        {
          target: polygonGeometry,
          scale: 50000 // Escala apropriada para visualizar municípios
        }, 
        {
          duration: 1000,
          easing: "ease-in-out"
        }
      );

      return polygonGeometry;
    } catch (error) {
      console.error('Erro ao exibir município:', error);
      return null;
    }
  }

  // Método para verificar se uma geometria está dentro de outra
  isWithin(innerGeometry, outerGeometry) {
    return geometryEngine.within(innerGeometry, outerGeometry);
  }

  // Método para verificar interseção com município
  validateIntersectsWithMunicipality(geometry, municipalityGeometry) {
    if (!geometry || !municipalityGeometry) return false;
    return geometryEngine.intersects(geometry, municipalityGeometry);
  }

  // Método para atualizar o estado do símbolo temporário
  updateTempGraphicSymbol(state) {
    this.tempSymbolState = state;
  }

  // Versão atualizada do método activateDrawTool
  activateDrawTool(type = "polygon", onUpdate = null, onDrawComplete = null) {
    // Limpa qualquer desenho ativo
    this.drawTool.reset();

    return new Promise((resolve) => {
      // Ativar desenho de polígono ou ponto
      const action = this.drawTool.create(type);

      // Criar uma camada temporária para exibir o desenho em andamento
      const tempGraphicLayer =
        this.layers["temp"] || new GraphicsLayer({ id: "temp" });
      if (!this.layers["temp"]) {
        this.map.add(tempGraphicLayer);
        this.layers["temp"] = tempGraphicLayer;
      } else {
        tempGraphicLayer.removeAll();
      }

      // Eventos de desenho para atualização em tempo real
      action.on(
        ["vertex-add", "vertex-remove", "cursor-update", "redo", "undo"],
        (event) => {
          // Limpar gráficos temporários anteriores
          tempGraphicLayer.removeAll();

          // Criar uma geometria temporária com os vértices atuais
          let tempGeometry;

          if (type === "point") {
            if (event.coordinates && event.coordinates.length > 0) {
              tempGeometry = new Point({
                x: event.coordinates[0],
                y: event.coordinates[1],
                spatialReference: this.view.spatialReference,
              });
            }
          } else {
            // Polígono
            if (event.vertices && event.vertices.length > 0) {
              tempGeometry = new Polygon({
                rings: [event.vertices],
                spatialReference: this.view.spatialReference,
              });
            }
          }

          // Se temos uma geometria temporária, exibi-la com símbolo
          if (tempGeometry) {
            // Definir símbolo para visualização temporária
            const tempSymbol = this.getTempSymbol(type, this.tempSymbolState);

            // Adicionar gráfico temporário
            const tempGraphic = new Graphic({
              geometry: tempGeometry,
              symbol: tempSymbol,
            });

            tempGraphicLayer.add(tempGraphic);

            // Chamar callback de atualização se fornecido
            if (onUpdate && typeof onUpdate === "function") {
              onUpdate(tempGeometry);
            }
          }
        }
      );

      action.on("draw-complete", (event) => {
        // Limpar a camada temporária
        tempGraphicLayer.removeAll();

        // Ao completar o desenho, criar a geometria final
        const geometry =
          type === "point"
            ? new Point({
                x: event.coordinates[0],
                y: event.coordinates[1],
                spatialReference: this.view.spatialReference,
              })
            : new Polygon({
                rings: [event.vertices],
                spatialReference: this.view.spatialReference,
              });

        // Se tiver callback de conclusão personalizado, usá-lo para validação
        if (onDrawComplete && typeof onDrawComplete === "function") {
          const validatedGeometry = onDrawComplete(geometry);
          resolve(validatedGeometry);
        } else {
          resolve(geometry);
        }
      });
    });
  }

  // Método atualizado para suportar diferentes estados de símbolos
  getTempSymbol(type, state = "default") {
    if (type === "point") {
      // Cores diferentes baseadas no estado
      let color, outlineColor;

      switch (state) {
        case "warning":
          color = [255, 0, 0, 0.7]; // Vermelho mais intenso
          outlineColor = [255, 0, 0, 1];
          break;
        case "valid":
          color = [0, 255, 0, 0.7]; // Verde
          outlineColor = [0, 255, 0, 1];
          break;
        default:
          color = [255, 0, 0, 0.5]; // Vermelho padrão
          outlineColor = [255, 0, 0, 0.8];
      }

      return {
        type: "simple-marker",
        style: "circle",
        color: color,
        size: "12px",
        outline: {
          color: outlineColor,
          width: 1,
        },
      };
    } else {
      // Polígono
      return {
        type: "simple-fill",
        color: [0, 0, 255, 0.2],
        outline: {
          color: [0, 0, 255, 0.7],
          width: 2,
          style: "dash",
        },
      };
    }
  }

  addGraphic(layerId, geometry, symbol, attributes = {}) {
    const layer = this.layers[layerId];

    if (!layer) {
      console.error(`Camada ${layerId} não encontrada.`);
      return null;
    }

    // Definir símbolo padrão se não for fornecido
    const defaultSymbol = this.getDefaultSymbol(layerId);
    const graphicSymbol = symbol || defaultSymbol;

    // Criar e adicionar o gráfico
    const graphic = new Graphic({
      geometry,
      symbol: graphicSymbol,
      attributes: {
        id: `${layerId}-${Date.now()}`,
        type: layerId,
        ...attributes,
      },
    });

    layer.add(graphic);
    return graphic;
  }

  clearLayer(layerId) {
    const layer = this.layers[layerId];
    if (layer) {
      layer.removeAll();
    }
  }

  calculateArea(geometry) {
    // Calcular área em metros quadrados e converter para hectares
    const area = geometryEngine.geodesicArea(geometry, "square-meters");
    return area / 10000; // Converter para hectares
  }

  intersects(geometry1, geometry2) {
    return geometryEngine.intersects(geometry1, geometry2);
  }

  intersection(geometry1, geometry2) {
    return intersectionOperator.execute(geometry1, geometry2);
  }

  contains(geometry1, geometry2) {
    return containsOperator.execute(geometry1, geometry2);
  }

  difference(geometry1, geometry2) {
    return geometryEngine.difference(geometry1, geometry2);
  }

  getDefaultSymbol(layerId) {
    // Definir símbolos padrão para cada tipo de camada
    const symbols = {
      propertyArea: {
        type: "simple-fill",
        color: colors.layers.propertyArea.fill,
        outline: {
          color: colors.layers.propertyArea.outline,
          width: 2,
        },
      },
      headquarters: {
        type: "simple-marker",
        style: "square",
        color: colors.layers.headquarters.fill,
        size: "12px",
        outline: {
          color: colors.layers.headquarters.outline,
          width: 1,
        },
      },
      consolidatedArea: {
        type: "simple-fill",
        color: colors.layers.consolidatedArea.fill,
        outline: {
          color: colors.layers.consolidatedArea.outline,
          width: 1,
        },
      },
      nativeVegetation: {
        type: "simple-fill",
        color: colors.layers.nativeVegetation.fill,
        outline: {
          color: colors.layers.nativeVegetation.outline,
          width: 1,
        },
      },
      fallow: {
        type: "simple-fill",
        color: colors.layers.fallow.fill,
        outline: {
          color: colors.layers.fallow.outline,
          width: 1,
        },
      },
      administrativeServitude: {
        type: "simple-fill",
        color: colors.layers.administrativeServitude.fill,
        outline: {
          color: colors.layers.administrativeServitude.outline,
          width: 1,
        },
      },
      hydrography: {
        type: "simple-fill",
        color: colors.layers.hydrography.fill,
        outline: {
          color: colors.layers.hydrography.outline,
          width: 1,
        },
      },
      anthropizedAfter2008: {
        type: "simple-fill",
        color: colors.layers.anthropizedAfter2008.fill,
        outline: {
          color: colors.layers.anthropizedAfter2008.outline,
          width: 1,
        },
      },
    };

    return symbols[layerId] || symbols.propertyArea;
  }

  // Destruir e liberar recursos
  destroy() {
    if (this.view) {
      this.view.destroy();
    }
  }
}

export default new ArcGISService();