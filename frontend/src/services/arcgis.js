import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Draw from "@arcgis/core/views/draw/Draw";
import Polyline from "@arcgis/core/geometry/Polyline";
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
    this.clickHandler = null; // Nova propriedade para controlar handlers de clique
    this.Point = Point; // Referência para criar novos pontos
    this.Polyline = Polyline; // Referência para criar novas linhas
    this.Polygon = Polygon; // Referência para criar novos polígonos
    this.GraphicsLayer = GraphicsLayer; // Referência para criar novas camadas
    this.Graphic = Graphic; // Referência para criar novos gráficos
    this.geometryEngine = geometryEngine; // Referência para o motor de geometria
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
      // Configuração do popup
      popup: {
        dockEnabled: false,
        dockOptions: {
          position: "top-right",
          breakpoint: false,
        },
        actions: [],
        autoOpenEnabled: false, // Não abrir automaticamente ao clicar, apenas no hover
        defaultPopupTemplateEnabled: true,
      },
    });

    const style = document.createElement("style");
    style.textContent = `
  /* Estilo personalizado para o popup do centroide */
  .esri-popup__main-container {
    max-width: 200px !important;
  }
  
  .esri-popup__header {
    background-color: #409EFF;
  }
  
  .esri-popup__header-title {
    font-weight: bold;
    color: white;
  }
  
  /* Estilo para o tooltip personalizado */
  .municipality-tooltip {
    position: absolute;
    background-color: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 5px 10px;
    font-size: 14px;
    pointer-events: none;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .municipality-tooltip.visible {
    opacity: 1;
  }
`;
    document.head.appendChild(style);

    // Criar o elemento do tooltip personalizado (alternativa ao popup)
    const tooltip = document.createElement("div");
    tooltip.className = "municipality-tooltip";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    // Armazenar uma referência ao tooltip
    this.tooltip = tooltip;

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

    // Inicializar o tooltip customizado
    this.initTooltip();

    return this.view.when();
  }

  // Método para carregar a projeção antecipadamente
  loadProjection() {
    if (coordinateFormatter.isSupported()) {
      projection
        .load()
        .then(() => {
          console.log("Módulo de projeção carregado com sucesso");
          this.projectionLoaded = true;
        })
        .catch((err) => {
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
      if (
        this.projectionLoaded &&
        polygonGeometry.spatialReference.wkid !== viewSR.wkid
      ) {
        try {
          finalGeometry = projection.project(polygonGeometry, viewSR);
          console.log(
            "Município reprojetado de",
            polygonGeometry.spatialReference.wkid,
            "para",
            viewSR.wkid
          );
        } catch (e) {
          console.warn(
            "Erro ao reprojetar município, usando geometria original:",
            e
          );
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

  displayCentroid(geometry, municipality) {
    if (!geometry || !municipality) {
      console.error(
        "Geometria ou município inválido para cálculo de centróide"
      );
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

      // Criar símbolo de imagem para o centróide
      const pictureSymbol = {
        type: "picture-marker",
        url: locationIcon,
        width: 32,
        height: 32,
        // Ajustar o deslocamento para que o ponto de ancoragem seja o centro da imagem
        xoffset: 0,
        yoffset: 16, // Deslocamento vertical para que a parte inferior do ícone aponte para o local exato
      };

      // Criar atributos para o centróide
      const attributes = {
        id: `centroid-${municipality.id}`,
        name: municipality.name,
        description: `Centróide de ${municipality.name}`,
      };

      // Criar popup template para mostrar informações ao passar o mouse
      const popupTemplate = {
        title: "{name}",
        content: "{description}",
        overwriteActions: true,
      };

      // Criar gráfico para o centróide
      const centroidGraphic = new Graphic({
        geometry: centroid,
        symbol: pictureSymbol,
        attributes: attributes,
        popupTemplate: popupTemplate,
      });

      // Adicionar à camada de centróide
      this.centroidLayer.add(centroidGraphic);

      // Configurar comportamento de hover para o centróide
      if (this.view) {
        // Implementação do tooltip customizado
        this.view.on("pointer-move", (event) => {
          // Usar hitTest para verificar se o mouse está sobre o centróide
          this.view.hitTest(event).then((response) => {
            // Verificar se o mouse está sobre o centróide
            const centroidHit = response.results.find(
              (result) =>
                result.graphic &&
                result.graphic.attributes &&
                result.graphic.attributes.id &&
                result.graphic.attributes.id.startsWith("centroid-")
            );

            if (centroidHit) {
              // Verificar se o tooltip customizado está disponível
              if (this.tooltip) {
                const tooltipText = municipality.name;

                // Posicionar e mostrar o tooltip
                this.tooltip.textContent = tooltipText;
                this.tooltip.style.display = "block";
                this.tooltip.style.left = `${event.x + 10}px`;
                this.tooltip.style.top = `${event.y + 10}px`;
                this.tooltip.classList.add("visible");
              } else {
                // Fallback para o popup padrão se o tooltip não estiver disponível
                this.view.popup.open({
                  features: [centroidHit.graphic],
                  location: centroid,
                });
              }
            } else {
              // Esconder o tooltip se não estiver sobre o centróide
              if (this.tooltip && this.tooltip.classList.contains("visible")) {
                this.tooltip.classList.remove("visible");
                setTimeout(() => {
                  if (!this.tooltip.classList.contains("visible")) {
                    this.tooltip.style.display = "none";
                  }
                }, 300);
              }

              // Fechar o popup se estiver usando o popup padrão
              if (
                this.view.popup.visible &&
                this.view.popup.selectedFeature &&
                this.view.popup.selectedFeature.attributes &&
                this.view.popup.selectedFeature.attributes.id &&
                this.view.popup.selectedFeature.attributes.id.startsWith(
                  "centroid-"
                )
              ) {
                this.view.popup.close();
              }
            }
          });
        });

        // Adicionar evento para dispositivos touch
        this.view.on("click", (event) => {
          this.view.hitTest(event).then((response) => {
            const centroidHit = response.results.find(
              (result) =>
                result.graphic &&
                result.graphic.attributes &&
                result.graphic.attributes.id &&
                result.graphic.attributes.id.startsWith("centroid-")
            );

            if (centroidHit) {
              // Mostrar o popup ao clicar (para dispositivos móveis)
              this.view.popup.open({
                features: [centroidHit.graphic],
                location: centroid,
              });
            }
          });
        });
      }

      console.log("Centróide adicionado ao mapa com tooltip");
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

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }
  }

  /**
   * Ativa o modo de navegação (pan)
   */
  activatePanMode() {
    // Resetar qualquer ferramenta de desenho ativa
    if (this.drawTool) {
      this.drawTool.reset();
    }

    // Limpar qualquer handler de eventos específico
    if (this.clickHandler) {
      this.clickHandler.remove();
      this.clickHandler = null;
    }

    // Limpar qualquer ferramenta de medição ativa
    this.deactivateMeasurementTool();

    // Limpar camadas temporárias
    this.clearLayer("temp");

    // Garantir que a visualização esteja em um estado de navegação padrão
    // Em vez de definir propriedades específicas, apenas garantimos que
    // nenhuma ferramenta de interação esteja ativa
    if (this.view) {
      // Se a visualização tiver um modo de navegação explícito, use-o
      if (typeof this.view.navigateStart === "function") {
        this.view.navigateStart();
      } else if (typeof this.view.inputManager?.standardStart === "function") {
        // Alguns controles de navegação foram movidos para o inputManager
        this.view.inputManager.standardStart();
      }
    }
  }

  /**
   * Cancela a operação de desenho atual
   */
  cancelDrawing() {
    if (this.drawTool) {
      this.drawTool.reset();
    }
    this.clearLayer("temp");
  }

  /**
   * Inicia a edição de uma geometria existente
   * @param {Object} geometry - Geometria a ser editada
   * @param {String} layerId - ID da camada
   * @param {Function} callback - Função de retorno após edição
   */
  startEditing(geometry, layerId, callback) {
    // Verificar se a geometria está disponível
    if (!geometry) {
      throw new Error("Geometria não disponível para edição");
    }

    // Limpar qualquer desenho ativo
    this.drawTool.reset();

    // Limpar a camada temporária
    this.clearLayer("temp");

    // Criar uma cópia da geometria para edição
    const editableGeometry = geometry.clone();

    // Adicionar a geometria à camada temporária com aparência diferente (modo de edição)
    const editSymbol = {
      type: geometry.type === "point" ? "simple-marker" : "simple-fill",
      color: [255, 165, 0, 0.5], // Laranja transparente
      outline: {
        color: [255, 165, 0, 1],
        width: 2,
        style: "dash",
      },
    };

    // Adicionar a geometria à camada temporária
    this.addGraphic("temp", editableGeometry, editSymbol);

    // Centralizar na geometria
    this.zoomToGeometry(editableGeometry);

    // Determinar o tipo de edição com base no tipo de geometria
    const editType = editableGeometry.type === "point" ? "point" : "reshape";

    // Iniciar a edição
    this._startEditSession(editableGeometry, editType, (editedGeometry) => {
      // Limpar a camada temporária
      this.clearLayer("temp");

      // Se a geometria foi editada com sucesso, chamar o callback
      if (editedGeometry) {
        callback(editedGeometry);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Inicia uma sessão de edição com a geometria fornecida
   * @param {Object} geometry - Geometria a ser editada
   * @param {String} editType - Tipo de edição ('point', 'reshape', etc.)
   * @param {Function} callback - Função a ser chamada após conclusão
   * @private
   */
  _startEditSession(geometry, editType, callback) {
    // Implementação simplificada - na prática, isso usaria os widgets de edição do ArcGIS
    // que não estão completamente disponíveis no ambiente atual

    if (editType === "point") {
      // Para pontos, permitir mover o ponto para uma nova localização
      this.clickHandler = this.view.on("click", (event) => {
        // Criar um novo ponto na localização do clique
        const newPoint = {
          type: "point",
          x: event.mapPoint.x,
          y: event.mapPoint.y,
          spatialReference: this.view.spatialReference,
        };

        // Limpar o handler de clique
        this.clickHandler.remove();
        this.clickHandler = null;

        // Chamar o callback com o novo ponto
        callback(newPoint);
      });
    } else {
      // Para polígonos, usar a ferramenta de redesenho
      const action = this.drawTool.reshape(geometry);

      action.on("reshape-complete", (event) => {
        // Chamar o callback com a geometria redesenhada
        callback(event.geometry);
      });
    }
  }

  /**
   * Para a edição atual
   */
  stopEditing() {
    // Resetar a ferramenta de desenho
    if (this.drawTool) {
      this.drawTool.reset();
    }

    // Remover handler de clique
    if (this.clickHandler) {
      this.clickHandler.remove();
      this.clickHandler = null;
    }

    // Limpar camada temporária
    this.clearLayer("temp");
  }

  /**
   * Ativa a ferramenta de medição
   * @param {Function} callback - Função de retorno para o resultado da medição
   */
  activateMeasurementTool(callback) {
    // Resetar qualquer ferramenta ativa
    if (this.drawTool) {
      this.drawTool.reset();
    }

    // Limpar camada temporária
    this.clearLayer("temp");

    // Inicializar a camada de medição, se necessário
    if (!this.layers["measurement"]) {
      const measurementLayer = new this.GraphicsLayer({
        id: "measurement",
      });
      this.map.add(measurementLayer);
      this.layers["measurement"] = measurementLayer;
    } else {
      this.layers["measurement"].removeAll();
    }

    // Iniciar a ferramenta de desenho para medição de distância (linha)
    const action = this.drawTool.create("polyline");

    // Adicionar evento de atualização para mostrar medição em tempo real
    action.on(
      ["vertex-add", "vertex-remove", "cursor-update", "redo", "undo"],
      (event) => {
        // Limpar gráficos temporários anteriores
        this.layers["measurement"].removeAll();

        // Se temos vértices, criar uma linha temporária
        if (event.vertices && event.vertices.length > 0) {
          const tempLine = new this.Polyline({
            paths: [event.vertices],
            spatialReference: this.view.spatialReference,
          });

          // Calcular comprimento da linha em metros
          const length = this.geometryEngine.geodesicLength(tempLine, "meters");

          // Adicionar linha ao mapa
          const lineSymbol = {
            type: "simple-line",
            color: [0, 0, 255, 1],
            width: 2,
            style: "solid",
          };

          // Adicionar a linha à camada de medição
          this.layers["measurement"].add(
            new this.Graphic({
              geometry: tempLine,
              symbol: lineSymbol,
            })
          );

          // Chamar o callback com o resultado
          callback({
            type: "distance",
            value: length,
          });
        }
      }
    );

    // Evento para conclusão do desenho
    action.on("draw-complete", (event) => {
      // Criar linha a partir dos vértices
      const line = new this.Polyline({
        paths: [event.vertices],
        spatialReference: this.view.spatialReference,
      });

      // Calcular distância final
      const finalLength = this.geometryEngine.geodesicLength(line, "meters");

      // Chamar o callback com o resultado final
      callback({
        type: "distance",
        value: finalLength,
      });

      // Manter a linha no mapa
      const lineSymbol = {
        type: "simple-line",
        color: [0, 0, 255, 1],
        width: 3,
        style: "solid",
      };

      this.layers["measurement"].add(
        new this.Graphic({
          geometry: line,
          symbol: lineSymbol,
        })
      );

      // Retornar ao modo de medição para permitir várias medições
      setTimeout(() => {
        this.activateMeasurementTool(callback);
      }, 100);
    });
  }

  /**
   * Desativa a ferramenta de medição
   */
  deactivateMeasurementTool() {
    // Resetar a ferramenta de desenho
    if (this.drawTool) {
      this.drawTool.reset();
    }

    // Limpar a camada de medição
    if (this.layers["measurement"]) {
      this.layers["measurement"].removeAll();
    }
  }

  /**
   * Importa geometria de um arquivo
   * @param {File} file - Arquivo a ser importado (GeoJSON, Shapefile, etc.)
   * @returns {Promise} Promessa com a geometria importada
   */
  async importGeometryFromFile(file) {
    return new Promise((resolve, reject) => {
      try {
        // Esta é uma implementação simplificada. Na realidade, seria necessário:
        // 1. Para GeoJSON: Ler o arquivo como texto e parsear
        // 2. Para Shapefile: Usar uma biblioteca como shpjs
        // 3. Para KML: Usar um parser de KML

        // Aqui vamos implementar apenas para GeoJSON por simplicidade
        if (
          file.name.toLowerCase().endsWith(".json") ||
          file.name.toLowerCase().endsWith(".geojson")
        ) {
          const reader = new FileReader();

          reader.onload = (event) => {
            try {
              const geojson = JSON.parse(event.target.result);

              // Verificar se é um GeoJSON válido
              if (!geojson.type || !geojson.features) {
                reject(new Error("Arquivo GeoJSON inválido."));
                return;
              }

              // Extrair a primeira feature
              const feature = geojson.features[0];

              if (!feature || !feature.geometry) {
                reject(new Error("Nenhuma geometria encontrada no GeoJSON."));
                return;
              }

              // Converter para geometria ArcGIS
              let geometry;

              switch (feature.geometry.type) {
                case "Point":
                  geometry = new this.Point({
                    x: feature.geometry.coordinates[0],
                    y: feature.geometry.coordinates[1],
                    spatialReference: { wkid: 4326 }, // GeoJSON usa WGS84
                  });
                  break;
                case "LineString":
                  geometry = new this.Polyline({
                    paths: [feature.geometry.coordinates],
                    spatialReference: { wkid: 4326 },
                  });
                  break;
                case "Polygon":
                  geometry = new this.Polygon({
                    rings: feature.geometry.coordinates,
                    spatialReference: { wkid: 4326 },
                  });
                  break;
                default:
                  reject(
                    new Error(
                      `Tipo de geometria não suportado: ${feature.geometry.type}`
                    )
                  );
                  return;
              }

              // Reprojetar para o sistema de referência da visualização
              if (
                this.projectionLoaded &&
                geometry.spatialReference.wkid !==
                  this.view.spatialReference.wkid
              ) {
                geometry = this.projection.project(
                  geometry,
                  this.view.spatialReference
                );
              }

              resolve({ geometry, properties: feature.properties || {} });
            } catch (error) {
              reject(new Error(`Erro ao processar GeoJSON: ${error.message}`));
            }
          };

          reader.onerror = () => {
            reject(new Error("Erro ao ler o arquivo."));
          };

          reader.readAsText(file);
        } else {
          reject(
            new Error(
              "Formato de arquivo não suportado nesta implementação simplificada."
            )
          );
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Aplica zoom de aproximação
   */
  zoomIn() {
    if (this.view) {
      const currentZoom = this.view.zoom;
      this.view.goTo({ zoom: currentZoom + 1 });
    }
  }

  /**
   * Aplica zoom de afastamento
   */
  zoomOut() {
    if (this.view) {
      const currentZoom = this.view.zoom;
      this.view.goTo({ zoom: currentZoom - 1 });
    }
  }

  /**
   * Aplica zoom para uma geometria específica
   * @param {Object} geometry - Geometria para aplicar zoom
   */
  zoomToGeometry(geometry) {
    if (!geometry || !this.view) return;

    this.view.goTo(
      {
        target: geometry,
        scale: geometry.type === "point" ? 5000 : undefined,
      },
      {
        duration: 500,
        easing: "ease-in-out",
      }
    );
  }

  showCustomTooltip(event, text) {
    const tooltip = this.tooltip;
    if (!tooltip) return;

    tooltip.textContent = text;
    tooltip.style.display = "block";
    tooltip.style.left = `${event.x + 10}px`;
    tooltip.style.top = `${event.y + 10}px`;
    tooltip.classList.add("visible");
  }

  // Método para esconder o tooltip customizado
  hideCustomTooltip() {
    const tooltip = this.tooltip;
    if (!tooltip) return;

    tooltip.classList.remove("visible");
    setTimeout(() => {
      if (!tooltip.classList.contains("visible")) {
        tooltip.style.display = "none";
      }
    }, 300);
  }

  initTooltip() {
    // Adicionar CSS personalizado para estilizar o tooltip
    const style = document.createElement("style");
    style.textContent = `
      /* Estilo para o tooltip personalizado */
      .municipality-tooltip {
        position: absolute;
        background-color: white;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        padding: 5px 10px;
        font-size: 14px;
        font-weight: bold;
        color: #409EFF;
        pointer-events: none;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      }
  
      .municipality-tooltip.visible {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    // Criar o elemento do tooltip personalizado
    const tooltip = document.createElement("div");
    tooltip.className = "municipality-tooltip";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    // Armazenar uma referência ao tooltip
    this.tooltip = tooltip;
  }

  // Métodos auxiliares para gerenciar o tooltip
  showTooltip(event, text) {
    if (!this.tooltip) return;

    this.tooltip.textContent = text;
    this.tooltip.style.display = "block";
    this.tooltip.style.left = `${event.x + 15}px`;
    this.tooltip.style.top = `${event.y + 15}px`;
    this.tooltip.classList.add("visible");
  }

  hideTooltip() {
    if (!this.tooltip) return;

    this.tooltip.classList.remove("visible");
    setTimeout(() => {
      if (!this.tooltip.classList.contains("visible")) {
        this.tooltip.style.display = "none";
      }
    }, 200);
  }
}

export default new ArcGISService();
