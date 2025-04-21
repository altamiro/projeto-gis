import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Polygon from '@arcgis/core/geometry/Polygon';
import Point from '@arcgis/core/geometry/Point';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import * as intersectionOperator from '@arcgis/core/geometry/operators/intersectionOperator';
import Draw from '@arcgis/core/views/draw/Draw';
import colors from '../utils/colors';

export class ArcGISService {
  constructor() {
    this.map = null;
    this.view = null;
    this.drawTool = null;
    this.layers = {};
  }

  initializeMap(container) {
    // Criar o mapa base
    this.map = new Map({
      basemap: 'satellite'
    });

    // Criar a vista do mapa
    this.view = new MapView({
      container,
      map: this.map,
      center: [-49.0, -22.0], // Centro aproximado do estado de São Paulo
      zoom: 12
    });

    // Inicializar camadas gráficas para cada tipo de camada
    const layerTypes = [
      'propertyArea',
      'headquarters',
      'consolidatedArea',
      'nativeVegetation',
      'fallow',
      'administrativeServitude',
      'hydrography',
      'anthropizedAfter2008'
    ];

    layerTypes.forEach(type => {
      const layer = new GraphicsLayer({
        id: type
      });
      this.map.add(layer);
      this.layers[type] = layer;
    });

    // Inicializar a ferramenta de desenho
    this.drawTool = new Draw({
      view: this.view
    });

    return this.view.when();
  }

  activateDrawTool(type = 'polygon') {
    // Limpa qualquer desenho ativo
    this.drawTool.reset();

    return new Promise(resolve => {
      // Ativar desenho de polígono
      const action = this.drawTool.create(type);

      // Eventos de desenho
      action.on(['vertex-add', 'vertex-remove', 'cursor-update', 'redo', 'undo'], (event) => {
        // Atualização em tempo real durante o desenho
      });

      action.on('draw-complete', (event) => {
        // Ao completar o desenho
        const geometry = (type === 'point') 
          ? new Point({
              x: event.coordinates[0],
              y: event.coordinates[1],
              spatialReference: this.view.spatialReference
            })
          : new Polygon({
              rings: event.vertices,
              spatialReference: this.view.spatialReference
            });

        resolve(geometry);
      });
    });
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
        ...attributes
      }
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
    const area = geometryEngine.geodesicArea(geometry, 'square-meters');
    return area / 10000; // Converter para hectares
  }

  intersects(geometry1, geometry2) {
    return geometryEngine.intersects(geometry1, geometry2);
  }

  intersection(geometry1, geometry2) {
    return intersectionOperator.execute(geometry1, geometry2);
  }

  difference(geometry1, geometry2) {
    return geometryEngine.difference(geometry1, geometry2);
  }

  getDefaultSymbol(layerId) {
    // Definir símbolos padrão para cada tipo de camada
    const symbols = {
      propertyArea: {
        type: 'simple-fill',
        color: colors.layers.propertyArea.fill,
        outline: {
          color: colors.layers.propertyArea.outline,
          width: 2
        }
      },
      headquarters: {
        type: 'simple-marker',
        style: 'square',
        color: colors.layers.headquarters.fill,
        size: '12px',
        outline: {
          color: colors.layers.headquarters.outline,
          width: 1
        }
      },
      consolidatedArea: {
        type: 'simple-fill',
        color: colors.layers.consolidatedArea.fill,
        outline: {
          color: colors.layers.consolidatedArea.outline,
          width: 1
        }
      },
      nativeVegetation: {
        type: 'simple-fill',
        color: colors.layers.nativeVegetation.fill,
        outline: {
          color: colors.layers.nativeVegetation.outline,
          width: 1
        }
      },
      fallow: {
        type: 'simple-fill',
        color: colors.layers.fallow.fill,
        outline: {
          color: colors.layers.fallow.outline,
          width: 1
        }
      },
      administrativeServitude: {
        type: 'simple-fill',
        color: colors.layers.administrativeServitude.fill,
        outline: {
          color: colors.layers.administrativeServitude.outline,
          width: 1
        }
      },
      hydrography: {
        type: 'simple-fill',
        color: colors.layers.hydrography.fill,
        outline: {
          color: colors.layers.hydrography.outline,
          width: 1
        }
      },
      anthropizedAfter2008: {
        type: 'simple-fill',
        color: colors.layers.anthropizedAfter2008.fill,
        outline: {
          color: colors.layers.anthropizedAfter2008.outline,
          width: 1
        }
      }
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