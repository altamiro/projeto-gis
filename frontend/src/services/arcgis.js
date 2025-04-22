import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Draw from "@arcgis/core/views/draw/Draw";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as projection from "@arcgis/core/geometry/projection";
import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import * as containsOperator from "@arcgis/core/geometry/operators/containsOperator";
import * as projectOperator from "@arcgis/core/geometry/operators/projectOperator";
import * as coordinateFormatter from "@arcgis/core/geometry/coordinateFormatter";
import * as centroidOperator from "@arcgis/core/geometry/operators/centroidOperator";

import colors from "../utils/colors";

import locationIcon from "@/assets/localizacao.png";

export class ArcGISService {
  constructor() {
    this.map = null;
    this.view = null;
    this.drawTool = null;
    this.layers = {};
    this.tempSymbolState = "default";
    this.municipalityLayer = null;
    this.centroidLayer = null;
    this.projectionLoaded = false;
  }

  initializeMap(container) {
    // Carregar a projeção antecipadamente para evitar problemas
    this.loadProjection();

    // Criar o mapa base com satellite explicitamente definido
    this.map = new Map({
      basemap: "satellite",
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
        maxZoom: 20,
      },
      // UI básica para interagir com o mapa
      ui: {
        components: ["zoom", "compass", "attribution"],
      },
      // Melhorar performance da navegação
      navigation: {
        browserTouchPanEnabled: true,
      },
    });

    // Inicializar camada de município
    this.municipalityLayer = new GraphicsLayer({
      id: "municipality",
    });
    this.map.add(this.municipalityLayer);

    // Inicializar camada para o centróide
    this.centroidLayer = new GraphicsLayer({
      id: "centroid",
    });
    this.map.add(this.centroidLayer);

    // Inicializar camadas gráficas para cada tipo de camada
    const layerTypes = [
      "area_imovel",
      "sede_imovel",
      "area_consolidada",
      "vegetacao_nativa",
      "area_pousio",
      "area_servidao_administrativa_total",
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

  // Método para carregar a projeção antecipadamente
  loadProjection() {
    if (coordinateFormatter.isSupported()) {
      projection.load()
        .then(() => {
          console.log("Módulo de projeção carregado com sucesso");
          this.projectionLoaded = true;
        })
        .catch(err => {
          console.warn("Erro ao carregar módulo de projeção:", err);
          this.projectionLoaded = false;
        });
    } else {
      console.warn("Projeção não suportada neste ambiente");
      this.projectionLoaded = false;
    }
  }

  // Método atualizado para exibir geometria do município
  displayMunicipality(municipality) {
    if (!municipality || !municipality.geometry) {
      console.error("Município sem geometria válida");
      return null;
    }

    // Limpar camada do município e do centróide
    this.municipalityLayer.removeAll();
    this.centroidLayer.removeAll();

    try {
      // Converter a geometria GeoJSON para ArcGIS Polygon
      const rings = municipality.geometry.coordinates;

      // SIRGAS 2000 para o Brasil (wkid 4674)
      const polygonGeometry = new Polygon({
        rings: rings,
        spatialReference: { wkid: 4674 },
      });

      console.log("Geometria do município carregada:", polygonGeometry);

      // Tentativa de reprojetar a geometria (se necessário)
      const viewSR = this.view.spatialReference;
      let finalGeometry = polygonGeometry;

      // Reprojetar a geometria do município para o mesmo SR da vista
      if (this.projectionLoaded && 
          polygonGeometry.spatialReference.wkid !== viewSR.wkid) {
        try {
          finalGeometry = projection.project(polygonGeometry, viewSR);
          console.log(
            "Município reprojetado de",
            polygonGeometry.spatialReference.wkid,
            "para",
            viewSR.wkid
          );
        } catch (e) {
          console.warn("Erro ao reprojetar município, usando geometria original:", e);
          finalGeometry = polygonGeometry;
        }
      }

      // Exibir a geometria do município
      this.displayMunicipalityGraphic(finalGeometry, municipality);
      
      // Calcular e exibir o centróide
      this.displayCentroid(finalGeometry, municipality);
      
      return finalGeometry;
    } catch (error) {
      console.error("Erro ao exibir município:", error);
      return null;
    }
  }

  // Novo método para calcular e exibir o centróide do município
  displayCentroid(geometry, municipality) {
    if (!geometry || !municipality) {
      console.error("Geometria ou município inválido para cálculo de centróide");
      return;
    }

    try {
      // Calcular o centróide da geometria
      const centroid = this.centroid(geometry);
      
      if (!centroid) {
        console.error("Não foi possível calcular o centróide do município");
        return;
      }
      
      console.log("Centróide calculado:", centroid);
      
      // Configurar o URL do ícone
      const iconUrl = `${process.env.BASE_URL || '/'}img/localizacao.png`;
      
      // Criar símbolo de imagem para o centróide
      const pictureSymbol = {
        type: "picture-marker",
        url: locationIcon,
        width: 32,
        height: 32,
        // Ajustar o deslocamento para que o ponto de ancoragem seja o centro da imagem
        xoffset: 0,
        yoffset: 16 // Deslocamento vertical para que a parte inferior do ícone aponte para o local exato
      };
      
      // Criar gráfico para o centróide
      const centroidGraphic = new Graphic({
        geometry: centroid,
        symbol: pictureSymbol,
        attributes: {
          id: `centroid-${municipality.id}`,
          name: `Centróide de ${municipality.name}`
        }
      });
      
      // Adicionar à camada de centróide
      this.centroidLayer.add(centroidGraphic);
      
      console.log("Centróide adicionado ao mapa");
    } catch (error) {
      console.error("Erro ao exibir centróide:", error);
    }
  }

  // Método auxiliar para exibir o gráfico do município
  displayMunicipalityGraphic(geometry, municipality) {
    // Definir símbolo para o município
    const municipalitySymbol = {
      type: "simple-fill",
      color: [173, 216, 230, 0.1],
      outline: {
        color: [0, 0, 255, 0.8],
        width: 2,
      },
    };

    // Criar gráfico e adicionar à camada
    const municipalityGraphic = new Graphic({
      geometry: geometry,
      symbol: municipalitySymbol,
      attributes: {
        id: municipality.id,
        name: municipality.name,
      },
    });

    this.municipalityLayer.add(municipalityGraphic);

    // Configurar mapa
    if (this.map.basemap.id !== "satellite") {
      this.map.basemap = "satellite";
    }

    // Centralizar no município
    this.view.goTo(
      {
        target: geometry,
        scale: 50000,
      },
      {
        duration: 1000,
        easing: "ease-in-out",
      }
    );
  }

  // Método para verificar se uma geometria está dentro de outra
  isWithin(innerGeometry, outerGeometry) {
    return geometryEngine.within(innerGeometry, outerGeometry);
  }

  // Método para verificar interseção com município
  validateIntersectsWithMunicipality(geometry, municipalityGeometry) {
    if (!geometry || !municipalityGeometry) {
      console.log("Geometrias inválidas para validação de interseção");
      return false;
    }

    try {
      // Log para depuração
      console.log("Verificando interseção com sistemas diferentes:", {
        geometria: geometry.spatialReference?.wkid,
        municipio: municipalityGeometry.spatialReference?.wkid,
      });

      // Garantir que projection está carregado
      if (!coordinateFormatter.isSupported()) {
        console.warn("Projeção não suportada no ambiente atual!");
        // Alternativa: usar verificação direta de extent, mas pode ser imprecisa
        return this.checkExtentsOverlap(geometry, municipalityGeometry);
      }

      // Definir sistema de referência alvo - Web Mercator (padrão do ArcGIS JS)
      const targetSR = new SpatialReference({ wkid: 3857 });

      // Clonar as geometrias para não modificar as originais
      let geomToProject = geometry.clone();
      let muniToProject = municipalityGeometry.clone();

      // Verificar e carregar projeções necessárias se ainda não estiverem carregadas
      try {
        projection.load();
      } catch (e) {
        console.warn("Erro ao carregar módulo de projeção:", e);
      }

      // Reprojetar geometria do desenho se necessário
      if (geomToProject.spatialReference.wkid !== targetSR.wkid) {
        try {
          geomToProject = projection.project(geomToProject, targetSR);
          console.log("Geometria reprojetada para:", targetSR.wkid);
        } catch (e) {
          console.warn("Falha ao reprojetar geometria do desenho:", e);
        }
      }

      // Reprojetar geometria do município se necessário
      if (muniToProject.spatialReference.wkid !== targetSR.wkid) {
        try {
          muniToProject = projection.project(muniToProject, targetSR);
          console.log("Município reprojetado para:", targetSR.wkid);
        } catch (e) {
          console.warn("Falha ao reprojetar geometria do município:", e);
        }
      }

      // Verificar interseção com geometryEngine após reprojeção
      try {
        const intersects = geometryEngine.intersects(
          geomToProject,
          muniToProject
        );
        console.log("Resultado da interseção após reprojeção:", intersects);
        return intersects;
      } catch (e) {
        console.warn("Erro na verificação de interseção após reprojeção:", e);
      }

      // Se tudo falhar, usar verificação baseada em extent
      return this.checkExtentsOverlap(geomToProject, muniToProject);
    } catch (error) {
      console.error("Erro ao validar interseção:", error);

      // Temporariamente, para não bloquear o usuário, permitir continuar
      console.log("Assumindo interseção válida devido a erro");
      return true;
    }
  }

  checkExtentsOverlap(geometry1, geometry2) {
    const extent1 = geometry1.extent;
    const extent2 = geometry2.extent;

    if (!extent1 || !extent2) {
      console.log("Extents não disponíveis, assumindo interseção");
      return true;
    }

    // Verificar se há sobreposição de extents (retângulos delimitadores)
    const extentsOverlap = !(
      extent1.xmax < extent2.xmin ||
      extent1.xmin > extent2.xmax ||
      extent1.ymax < extent2.ymin ||
      extent1.ymin > extent2.ymax
    );

    console.log("Sobreposição de extents:", extentsOverlap);
    return extentsOverlap;
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
      // Polígono - atualizado para diferentes estados
      let fillColor, outlineColor, outlineWidth, outlineStyle;

      switch (state) {
        case "warning":
          fillColor = [255, 0, 0, 0.3]; // Vermelho claro
          outlineColor = [255, 0, 0, 0.8]; // Vermelho escuro
          outlineWidth = 2;
          outlineStyle = "dash";
          break;
        case "warning-medium":
          fillColor = [255, 165, 0, 0.3]; // Laranja claro
          outlineColor = [255, 165, 0, 0.8]; // Laranja escuro
          outlineWidth = 2;
          outlineStyle = "dash";
          break;
        case "valid":
          fillColor = [0, 255, 0, 0.3]; // Verde claro
          outlineColor = [0, 255, 0, 0.8]; // Verde escuro
          outlineWidth = 2;
          outlineStyle = "solid";
          break;
        default:
          fillColor = [0, 0, 255, 0.2]; // Azul claro
          outlineColor = [0, 0, 255, 0.7]; // Azul escuro
          outlineWidth = 2;
          outlineStyle = "dash";
      }

      return {
        type: "simple-fill",
        color: fillColor,
        outline: {
          color: outlineColor,
          width: outlineWidth,
          style: outlineStyle,
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

  project(geometry, targetSpatialReference) {
    return projectOperator.execute(geometry, targetSpatialReference);
  }

  centroid(geometry) {
    return centroidOperator.execute(geometry);
  }

  getDefaultSymbol(layerId) {
    // Definir símbolos padrão para cada tipo de camada
    const symbols = {
      area_imovel: {
        type: "simple-fill",
        color: colors.layers.area_imovel.fill,
        outline: {
          color: colors.layers.area_imovel.outline,
          width: 2,
        },
      },
      sede_imovel: {
        type: "simple-marker",
        style: "square",
        color: colors.layers.sede_imovel.fill,
        size: "12px",
        outline: {
          color: colors.layers.sede_imovel.outline,
          width: 1,
        },
      },
      area_consolidada: {
        type: "simple-fill",
        color: colors.layers.area_consolidada.fill,
        outline: {
          color: colors.layers.area_consolidada.outline,
          width: 1,
        },
      },
      vegetacao_nativa: {
        type: "simple-fill",
        color: colors.layers.vegetacao_nativa.fill,
        outline: {
          color: colors.layers.vegetacao_nativa.outline,
          width: 1,
        },
      },
      area_pousio: {
        type: "simple-fill",
        color: colors.layers.area_pousio.fill,
        outline: {
          color: colors.layers.area_pousio.outline,
          width: 1,
        },
      },
      area_servidao_administrativa_total: {
        type: "simple-fill",
        color: colors.layers.area_servidao_administrativa_total.fill,
        outline: {
          color: colors.layers.area_servidao_administrativa_total.outline,
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

    return symbols[layerId] || symbols.area_imovel;
  }

  // Verifica se pelo menos 50% da área da geometria está dentro do município
  validateMinimumAreaInMunicipality(
    geometry,
    municipalityGeometry,
    minimumPercentage = 50
  ) {
    console.log("Validação de área mínima iniciada");

    if (!geometry || !municipalityGeometry) {
      console.log("Geometrias inválidas para validação de área mínima");
      return false;
    }

    try {
      // Definir sistema de referência alvo para o cálculo de áreas
      const targetSR = new SpatialReference({ wkid: 3857 });

      // Clonar as geometrias para não modificar as originais
      let geomToProject = geometry.clone();
      let muniToProject = municipalityGeometry.clone();

      // Verificar e carregar projeções necessárias
      try {
        projection.load();
      } catch (e) {
        console.warn(
          "Erro ao carregar módulo de projeção para cálculo de área:",
          e
        );
      }

      // Reprojetar geometria do desenho se necessário
      if (geomToProject.spatialReference.wkid !== targetSR.wkid) {
        try {
          geomToProject = projection.project(geomToProject, targetSR);
        } catch (e) {
          console.warn(
            "Falha ao reprojetar geometria do desenho para cálculo de área:",
            e
          );
        }
      }

      // Reprojetar geometria do município se necessário
      if (muniToProject.spatialReference.wkid !== targetSR.wkid) {
        try {
          muniToProject = projection.project(muniToProject, targetSR);
        } catch (e) {
          console.warn(
            "Falha ao reprojetar geometria do município para cálculo de área:",
            e
          );
        }
      }

      // Calcular a interseção das geometrias reprojetadas
      try {
        const intersection = geometryEngine.intersect(
          geomToProject,
          muniToProject
        );

        // Se não há interseção, retorna falso
        if (!intersection) {
          console.log("Não há interseção entre as geometrias");
          return false;
        }

        // Calcular áreas
        const area_imovel = geometryEngine.geodesicArea(
          geomToProject,
          "square-meters"
        );
        const intersectionArea = geometryEngine.geodesicArea(
          intersection,
          "square-meters"
        );

        // Calcular porcentagem
        const percentage = (intersectionArea / area_imovel) * 100;

        console.log(
          `Porcentagem da área do imóvel dentro do município: ${percentage.toFixed(
            2
          )}%`
        );

        // Verificar se atende ao critério mínimo
        return percentage >= minimumPercentage;
      } catch (e) {
        console.warn("Erro ao calcular interseção ou áreas:", e);
      }

      // Se o cálculo preciso falhar, usar aproximação por extents
      return this.approximateAreaOverlap(
        geomToProject,
        muniToProject,
        minimumPercentage
      );
    } catch (error) {
      console.error("Erro ao validar área mínima:", error);

      // Em caso de erro, permitir continuar para não bloquear o usuário
      return true;
    }
  }

  // Método auxiliar para cálculo aproximado de sobreposição de área
  approximateAreaOverlap(geometry, municipalityGeometry, minimumPercentage) {
    const geometryExtent = geometry.extent;
    const municipalityExtent = municipalityGeometry.extent;

    if (!geometryExtent || !municipalityExtent) {
      console.log("Extents não disponíveis para aproximação de área");
      return true; // Permitir continuar
    }

    // Calcular áreas dos extents
    const geometryExtentArea =
      (geometryExtent.xmax - geometryExtent.xmin) *
      (geometryExtent.ymax - geometryExtent.ymin);

    // Calcular área de sobreposição dos extents
    const overlapXmin = Math.max(geometryExtent.xmin, municipalityExtent.xmin);
    const overlapXmax = Math.min(geometryExtent.xmax, municipalityExtent.xmax);
    const overlapYmin = Math.max(geometryExtent.ymin, municipalityExtent.ymin);
    const overlapYmax = Math.min(geometryExtent.ymax, municipalityExtent.ymax);

    const overlapWidth = Math.max(0, overlapXmax - overlapXmin);
    const overlapHeight = Math.max(0, overlapYmax - overlapYmin);
    const overlapArea = overlapWidth * overlapHeight;

    // Calcular porcentagem aproximada da sobreposição
    const overlapPercentage = (overlapArea / geometryExtentArea) * 100;

    console.log(
      `Porcentagem aproximada de sobreposição por extents: ${overlapPercentage.toFixed(
        2
      )}%`
    );

    // Verificar se atende ao critério mínimo
    return overlapPercentage >= minimumPercentage;
  }

  // Destruir e liberar recursos
  destroy() {
    if (this.view) {
      this.view.destroy();
    }
  }
}

export default new ArcGISService();
