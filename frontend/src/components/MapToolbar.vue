<template lang="pug">
  .map-toolbar-container
    .map-toolbar
      .toolbar-group.navigation-tools
        el-tooltip(content="Navegação (Pan)" placement="right")
          el-button(
            :class="{ active: currentTool === 'pan' }"
            @click="setTool('pan')"
            size="medium"
            icon="el-icon-rank"
          )
        el-tooltip(:content="getPolygonTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'polygon' }"
            @click="setTool('polygon')"
            size="medium"
            icon="el-icon-crop"
            :disabled="!canDrawPolygon"
          )
        el-tooltip(:content="getPointTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'point' }"
            @click="setTool('point')"
            size="medium"
            icon="el-icon-location-outline"
            :disabled="!canDrawPoint"
          )
        el-tooltip(:content="getLineTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'line' }"
            @click="setTool('line')"
            size="medium"
            icon="el-icon-minus"
            :disabled="!canDrawLine"
          )
        el-tooltip(:content="getEditTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'edit' }"
            @click="setTool('edit')"
            size="medium"
            icon="el-icon-edit-outline"
            :disabled="!canEditGeometry"
          )
        el-tooltip(content="Recortar geometria" placement="right")
          el-button(
            :class="{ active: currentTool === 'cut' }"
            @click="setTool('cut')"
            size="medium"
            icon="el-icon-scissors"
            :disabled="!canCutGeometry"
          )
        el-tooltip(:content="getEraseTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'erase' }"
            @click="confirmDelete"
            size="medium"
            icon="el-icon-delete"
            :disabled="!canDeleteGeometry"
          )
      .toolbar-group.measure-tools
        el-tooltip(content="Medir distância/área" placement="right")
          el-button(
            :class="{ active: currentTool === 'measure' }"
            @click="setTool('measure')"
            size="medium"
            icon="el-icon-discover"
          )

      .toolbar-group.zoom-tools
        el-tooltip(content="Aproximar (Zoom In)" placement="right")
          el-button(
            @click="zoomIn"
            size="medium"
            icon="el-icon-zoom-in"
          )
        el-tooltip(content="Afastar (Zoom Out)" placement="right")
          el-button(
            @click="zoomOut"
            size="medium"
            icon="el-icon-zoom-out"
          )
        el-tooltip(content="Ajustar à seleção" placement="right")
          el-button(
            @click="zoomToSelection"
            size="medium"
            icon="el-icon-full-screen"
            :disabled="!hasSelectedLayer"
          )
        el-tooltip(content="Ajustar ao município" placement="right")
          el-button(
            @click="zoomToMunicipality"
            size="medium"
            icon="el-icon-position"
            :disabled="!municipalitySelected"
          )
    
    // Card para exibir o nome da camada selecionada
    .layer-name-card(v-if="selectedLayerName")
      .layer-name-header
        span Camada: {{ selectedLayerName }}
    
    // Input para importação de arquivos
    input(
      type="file"
      ref="fileInput"
      style="display: none"
      @change="onFileSelected"
      accept=".shp,.json,.geojson,.kml,.zip"
    )
    
    // Modal de confirmação para exclusão
    .delete-dialog
      el-dialog(
        title="Confirmar Exclusão"
        :visible.sync="deleteDialogVisible"
        width="30%"
      )
        span {{ deleteConfirmationMessage }}
        span(slot="footer")
          el-button(@click="deleteDialogVisible = false") Cancelar
          el-button(type="danger" @click="deleteLayer") Confirmar
      
    // Modal de confirmação para ferramenta de recorte
    .cut-confirm-dialog
      el-dialog(
        title="Confirmação de Recorte"
        :visible.sync="cutConfirmDialogVisible"
        width="40%"
      )
        .cut-info
          p Este modo permite criar um polígono de recorte para modificar a geometria existente.
          p Selecione abaixo a operação desejada:
          
        .cut-options
          el-radio-group(v-model="cutOperation")
            el-radio(label="subtract") Subtrair área (recortar)
            el-radio(label="intersect") Interseção (manter área comum)
        
        span(slot="footer")
          el-button(@click="cutConfirmDialogVisible = false") Cancelar
          el-button(type="primary" @click="startCutOperation") Confirmar

    // Instruções de corte quando a ferramenta está ativa
    .cut-instructions(v-if="currentTool === 'cut' && isCutting")
      el-card(shadow="always")
        .card-header(slot="header")
          span Instruções de Recorte
        .instructions-content
          p Desenhe o polígono de recorte. Clique para adicionar vértices.
          p Clique duplo para finalizar o desenho.
          p Pressione ESC para cancelar.
        el-button(type="danger" @click="cancelCutOperation") Cancelar Recorte
    
    // Componente de medição
    .measurement-result(v-if="currentTool === 'measure' && measurementResult")
      el-card(shadow="always" class="measurement-card")
        .card-header(slot="header")
          span Resultado da Medição
        .measurement-content
          span(v-if="measurementResult.type === 'distance'") Distância: {{ formatDistance(measurementResult.value) }}
          span(v-else-if="measurementResult.type === 'area'") Área: {{ formatArea(measurementResult.value) }}
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
import arcgisService from '../services/arcgis';

export default {
  name: 'MapToolbar',
  data() {
    return {
      currentTool: 'pan',
      showLayerPanel: false,
      isDrawing: false,
      deleteDialogVisible: false,
      deleteConfirmationMessage: '',
      measurementResult: null,
      fileUploadInProgress: false,
      // Propriedades para a ferramenta de recorte
      cutConfirmDialogVisible: false,
      cutOperation: 'subtract', // 'subtract' ou 'intersect'
      isCutting: false,
      cutGeometry: null,
      targetGeometryForCut: null
    };
  },
  computed: {
    ...mapState({
      selectedLayer: state => state.layers.selectedLayer,
      layers: state => state.layers.layers,
      layerTypes: state => state.layers.layerTypes,
      municipalityGeometry: state => state.property.municipalityGeometry,
      municipality: state => state.property.municipality
    }),
    ...mapGetters({
      municipalitySelected: 'property/hasMunicipalitySelected'
    }),
    hasSelectedLayer() {
      return !!this.selectedLayer;
    },
    selectedLayerType() {
      if (!this.selectedLayer) return null;
      return this.layerTypes.find(lt => lt.id === this.selectedLayer);
    },
    selectedLayerName() {
      return this.selectedLayerType?.name || '';
    },
    selectedLayerGeometryType() {
      if (!this.selectedLayerType) return null;
      return this.selectedLayerType.tipo_geom;
    },
    hasDrawnGeometry() {
      return this.layers.some(l => l.id === this.selectedLayer);
    },
    canDrawPolygon() {
      if (!this.selectedLayer) return false;
      if (this.hasDrawnGeometry && this.selectedLayer === 'area_imovel') return false;

      // Verificar se o tipo de camada selecionada aceita polígonos
      return ['polygonSimple', 'multiPolygon'].includes(this.selectedLayerGeometryType);
    },
    canDrawPoint() {
      if (!this.selectedLayer) return false;
      if (this.hasDrawnGeometry && this.selectedLayer === 'area_imovel') return false;

      // Verificar se o tipo de camada selecionada aceita pontos
      return this.selectedLayerGeometryType === 'point';
    },
    canDrawLine() {
      if (!this.selectedLayer) return false;
      if (this.hasDrawnGeometry && this.selectedLayer === 'area_imovel') return false;

      // Verificar se o tipo de camada selecionada aceita linhas
      return this.selectedLayerGeometryType === 'polyline';
    },
    canEditGeometry() {
      // Pode editar geometria apenas se ela já existe
      return this.hasSelectedLayer && this.hasDrawnGeometry;
    },
    canDeleteGeometry() {
      // Pode excluir geometria apenas se ela já existe
      return this.hasSelectedLayer && this.hasDrawnGeometry;
    },
    canCutGeometry() {
      // Pode recortar apenas polígonos existentes (não pontos ou linhas)
      return this.hasSelectedLayer &&
        this.hasDrawnGeometry &&
        ['polygonSimple', 'multiPolygon'].includes(this.selectedLayerGeometryType);
    },
    canImportData() {
      // Pode importar dados apenas se uma camada estiver selecionada
      return this.hasSelectedLayer && !this.isDrawing;
    },
    // Verifica se a camada selecionada pode ser desenhada
    isLayerSelectable() {
      if (!this.selectedLayer) return false;

      // Se a camada área do imóvel já foi desenhada e estamos tentando desenhá-la novamente
      if (this.selectedLayer === 'area_imovel' && this.hasDrawnGeometry) {
        return false;
      }

      // Se for outra camada e ainda não temos área do imóvel
      if (this.selectedLayer !== 'area_imovel' && !this.layers.some(l => l.id === 'area_imovel')) {
        return false;
      }

      return true;
    },
    layerGroup() {
      if (!this.selectedLayer) return null;
      return this.$store.getters['layers/getLayerGroup'](this.selectedLayer);
    }
  },
  methods: {
    ...mapActions({
      addLayer: 'layers/addLayer',
      removeLayer: 'layers/removeLayer',
      addAlert: 'validation/addAlert',
      updateLayerGeometry: 'layers/updateLayerGeometry'
    }),
    ...mapMutations({
      setDrawingMode: 'layers/SET_DRAWING_MODE'
    }),
    setTool(tool) {
      // Se já estiver desenhando, não permitir mudar de ferramenta
      if ((this.isDrawing || this.isCutting) && this.currentTool !== tool) {
        this.addAlert({
          type: 'warning',
          message: 'Finalize a operação atual antes de trocar de ferramenta.'
        });
        return;
      }

      // Tratamento especial para a ferramenta de recorte
      if (tool === 'cut') {
        this.prepareCutTool();
        return;
      }

      // Desativa qualquer ferramenta ativa anterior
      this.deactivateCurrentTool();

      // Atualiza a ferramenta atual
      this.currentTool = tool;

      // Ativa a nova ferramenta
      this.activateTool(tool);
    },
    activateTool(tool) {
      switch (tool) {
        case 'pan':
          arcgisService.activatePanMode();
          break;
        case 'polygon':
          this.startDrawing('polygon');
          break;
        case 'point':
          this.startDrawing('point');
          break;
        case 'line':
          this.startDrawing('polyline');
          break;
        case 'edit':
          this.startEditing();
          break;
        case 'measure':
          this.startMeasurement();
          break;
        case 'cut':
          // A ferramenta de recorte é tratada separadamente
          break;
        default:
          arcgisService.activatePanMode();
      }
    },
    deactivateCurrentTool() {
      // Cancelar qualquer ferramenta ativa
      switch (this.currentTool) {
        case 'measure':
          this.stopMeasurement();
          break;
        case 'polygon':
        case 'point':
        case 'line':
          if (this.isDrawing) {
            arcgisService.cancelDrawing();
            this.isDrawing = false;
            this.setDrawingMode(false);
          }
          break;
        case 'edit':
          arcgisService.stopEditing();
          break;
        case 'cut':
          this.cancelCutOperation();
          break;
      }
    },
    async startDrawing(geometryType) {
      try {
        // Verificar se um município foi selecionado
        if (!this.municipalityGeometry && this.selectedLayer === 'area_imovel') {
          this.addAlert({
            type: 'error',
            message: 'Por favor, selecione um município antes de desenhar a área do imóvel.'
          });
          return;
        }

        // Verificar se a camada "Área do imóvel" já foi definida para camadas que a requerem
        if (this.selectedLayer !== 'area_imovel') {
          const area_imovelDefined = this.layers.some(l => l.id === 'area_imovel');
          if (!area_imovelDefined) {
            this.addAlert({
              type: 'error',
              message: 'É necessário definir a Área do imóvel antes de desenhar outras camadas.'
            });
            return;
          }
        }

        // Verificar se a camada área do imóvel já foi desenhada
        if (this.selectedLayer === 'area_imovel' && this.hasDrawnGeometry) {
          this.addAlert({
            type: 'warning',
            message: 'A Área do imóvel já foi definida. Para modificá-la, exclua-a primeiro.'
          });
          return;
        }

        this.isDrawing = true;
        this.setDrawingMode(true);

        // Determinar o tipo de geometria a ser desenhada baseado no tipo_geom do layer selecionado
        const selectedLayerType = this.layerTypes.find(lt => lt.id === this.selectedLayer);
        let geometryToUse;

        if (geometryType) {
          // Se for específicado, usa o tipo passado
          geometryToUse = geometryType;
        } else if (selectedLayerType) {
          // Mapear tipo_geom para tipo de geometria usado pelo ArcGIS
          switch (selectedLayerType.tipo_geom) {
            case 'point':
              geometryToUse = 'point';
              break;
            case 'polyline':
              geometryToUse = 'polyline';
              break;
            case 'polygonSimple':
            case 'multiPolygon':
              geometryToUse = 'polygon';
              break;
            default:
              geometryToUse = 'polygon'; // Fallback para polígono
          }
        } else {
          geometryToUse = 'polygon'; // Default
        }

        // Se for outra camada que não área do imóvel, precisamos recuperar a geometria da área do imóvel
        let propertyGeometry = null;
        if (this.selectedLayer !== 'area_imovel') {
          const propertyLayer = this.layers.find(l => l.id === 'area_imovel');
          if (!propertyLayer) {
            throw new Error('A área do imóvel precisa ser definida primeiro.');
          }
          propertyGeometry = propertyLayer.geometry;
        }

        // Adicionar callback para validação em tempo real
        const onUpdateGeometry = (tempGeometry) => {
          // Se estiver desenhando a sede, verificar se está dentro da área do imóvel
          if (this.selectedLayer === 'sede_imovel' && tempGeometry && propertyGeometry) {
            // Verificar se o ponto está dentro da área do imóvel
            const isInside = arcgisService.isWithin(tempGeometry, propertyGeometry);

            // Mostrar feedback visual temporário (cor diferente) se estiver fora
            if (!isInside) {
              // Atualizar a cor do ponto temporário para indicar que está inválido
              arcgisService.updateTempGraphicSymbol('warning');
            } else {
              arcgisService.updateTempGraphicSymbol('valid');
            }
          } else if (this.selectedLayer === 'area_imovel' && tempGeometry && this.municipalityGeometry) {
            // Verificar interseção básica
            const intersectsMunicipality = arcgisService.validateIntersectsWithMunicipality(
              tempGeometry,
              this.municipalityGeometry
            );

            // Verificar porcentagem mínima de área dentro do município
            const minimumAreaInMunicipality = intersectsMunicipality ?
              arcgisService.validateMinimumAreaInMunicipality(
                tempGeometry,
                this.municipalityGeometry,
                50
              ) : false;

            if (!intersectsMunicipality) {
              arcgisService.updateTempGraphicSymbol('warning');
            } else if (!minimumAreaInMunicipality) {
              // Usar um símbolo intermediário para indicar que há interseção, mas não o suficiente
              arcgisService.updateTempGraphicSymbol('warning-medium');
            } else {
              arcgisService.updateTempGraphicSymbol('valid');
            }
          } else if (geometryToUse === 'polygon' && tempGeometry) {
            // Para outras camadas, podemos mostrar a área em tempo real
            const tempArea = arcgisService.calculateArea(tempGeometry);
            this.measurementResult = {
              type: 'area',
              value: tempArea * 10000 // Converter para m²
            };
          } else if (geometryToUse === 'polyline' && tempGeometry) {
            // Para linhas, mostrar o comprimento em tempo real
            const tempLength = arcgisService.geometryEngine.geodesicLength(tempGeometry, "meters");
            this.measurementResult = {
              type: 'distance',
              value: tempLength
            };
          }
        };

        // Evento de conclusão do desenho personalizado para validar a geometria
        const onDrawComplete = (geometry) => {
          // Validações específicas por tipo de camada
          // Para área do imóvel, validar se pelo menos 50% está dentro do município selecionado
          if (this.selectedLayer === 'area_imovel' && this.municipalityGeometry) {
            try {
              // Validar interseção básica
              const intersectsMunicipality = arcgisService.validateIntersectsWithMunicipality(
                geometry,
                this.municipalityGeometry
              );

              if (!intersectsMunicipality) {
                this.addAlert({
                  type: 'error',
                  message: 'A área do imóvel deve intersectar o município selecionado.'
                });

                return null;
              }

              // Validar área mínima
              const minimumAreaInMunicipality = arcgisService.validateMinimumAreaInMunicipality(
                geometry,
                this.municipalityGeometry,
                50
              );

              if (!minimumAreaInMunicipality) {
                this.addAlert({
                  type: 'error',
                  message: 'No mínimo 50% da área do imóvel deve estar dentro do município selecionado.'
                });

                return null;
              }
            } catch (error) {
              console.error("Erro na validação:", error);
              // Em caso de erro na validação, permitir continuar
              console.log("Ignorando erro de validação para permitir uso");
            }
          }

          // Para sede do imóvel, validar se está dentro da área do imóvel
          if (this.selectedLayer === 'sede_imovel' && propertyGeometry) {
            const isInside = arcgisService.isWithin(geometry, propertyGeometry);

            if (!isInside) {
              // Mostrar mensagem de erro
              this.addAlert({
                type: 'error',
                message: 'A sede do imóvel deve estar dentro da área do imóvel.'
              });

              // Cancelar a operação de desenho
              return null;
            }
          }

          // Verificações para outras camadas que exigem estar dentro da área do imóvel
          if (['vegetacao_nativa', 'area_consolidada', 'area_pousio'].includes(this.selectedLayer) && propertyGeometry) {
            const isInside = arcgisService.isWithin(geometry, propertyGeometry);

            if (!isInside) {
              // Mostrar mensagem de erro
              this.addAlert({
                type: 'error',
                message: `A camada "${this.selectedLayerName}" deve estar completamente dentro da área do imóvel.`
              });

              return null;
            }
          }

          // Limpar resultado de medição após concluir
          this.measurementResult = null;

          // Retornar a geometria válida
          return geometry;
        };

        // Ativar a ferramenta de desenho com callbacks
        const geometry = await arcgisService.activateDrawTool(geometryToUse, onUpdateGeometry, onDrawComplete);

        // Se geometry for null, significa que foi cancelado ou falhou na validação
        if (!geometry) {
          this.isDrawing = false;
          this.setDrawingMode(false);
          return;
        }

        // Adicionar a camada com a geometria desenhada
        const result = await this.addLayer({
          layerId: this.selectedLayer,
          geometry
        });

        if (result.success) {
          // Exibir a geometria no mapa
          arcgisService.clearLayer(this.selectedLayer);
          arcgisService.addGraphic(this.selectedLayer, geometry);

          // Mostrar mensagem de sucesso
          this.addAlert({
            type: 'success',
            message: `${this.selectedLayerName} desenhada com sucesso.`
          });
        }

        // Voltar para o modo de navegação
        this.currentTool = 'pan';
        arcgisService.activatePanMode();
      } catch (error) {
        console.error('Erro ao desenhar:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao desenhar. Por favor, tente novamente.'
        });
      } finally {
        this.isDrawing = false;
        this.setDrawingMode(false);
      }
    },
    startEditing() {
      // Verifica se tem camada selecionada e desenhada
      if (!this.selectedLayer || !this.hasDrawnGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione uma camada com geometria para editar.'
        });
        this.currentTool = 'pan';
        return;
      }

      try {
        // Obter a geometria da camada selecionada
        const layer = this.layers.find(l => l.id === this.selectedLayer);
        if (!layer || !layer.geometry) {
          throw new Error('Geometria não encontrada para edição.');
        }

        // Chamar o serviço ArcGIS para iniciar a edição
        arcgisService.startEditing(layer.geometry, this.selectedLayer, this.selectedLayerGeometryType, (editedGeometry) => {
          if (editedGeometry) {
            // Atualizar a geometria no store
            this.updateLayerGeometry({
              layerId: this.selectedLayer,
              geometry: editedGeometry
            }).then(() => {
              // Mostrar mensagem de sucesso
              this.addAlert({
                type: 'success',
                message: `${this.selectedLayerName} editada com sucesso.`
              });

              // Limpar e redesenhar a camada no mapa
              arcgisService.clearLayer(this.selectedLayer);
              arcgisService.addGraphic(this.selectedLayer, editedGeometry);
            });
          }

          // Volta para o modo de navegação
          this.currentTool = 'pan';
          arcgisService.activatePanMode();
        });
      } catch (error) {
        console.error('Erro ao iniciar edição:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao iniciar o modo de edição.'
        });
        this.currentTool = 'pan';
      }
    },
    confirmDelete() {
      // Verifica se tem camada selecionada e desenhada
      if (!this.selectedLayer || !this.hasDrawnGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione uma camada com geometria para excluir.'
        });
        return;
      }

      if (this.selectedLayer === 'area_imovel') {
        this.deleteConfirmationMessage = 'ATENÇÃO: Excluir a Área do Imóvel irá remover TODAS as camadas. Esta ação é irreversível. Deseja continuar?';
      } else {
        this.deleteConfirmationMessage = `Tem certeza que deseja excluir a camada "${this.selectedLayerName}"?`;
      }

      this.deleteDialogVisible = true;
    },
    async deleteLayer() {
      try {
        const result = await this.removeLayer(this.selectedLayer);

        // Limpar a camada no mapa
        arcgisService.clearLayer(this.selectedLayer);

        // Fechar o diálogo
        this.deleteDialogVisible = false;

        // Mostrar mensagem
        this.addAlert({
          type: 'info',
          message: result.message || `${this.selectedLayerName} excluída com sucesso.`
        });

        // Volta para o modo de navegação
        this.currentTool = 'pan';
      } catch (error) {
        console.error('Erro ao excluir camada:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao excluir a camada.'
        });
      }
    },
    startMeasurement() {
      try {
        // Ativar ferramenta de medição
        arcgisService.activateMeasurementTool((result) => {
          if (result) {
            this.measurementResult = result;
          }
        });
      } catch (error) {
        console.error('Erro ao iniciar medição:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao iniciar a ferramenta de medição.'
        });
        this.currentTool = 'pan';
      }
    },
    stopMeasurement() {
      arcgisService.deactivateMeasurementTool();
      this.measurementResult = null;
    },
    handleImportClick() {
      // Acionar o input de arquivo
      this.$refs.fileInput.click();
    },
    async onFileSelected(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        this.fileUploadInProgress = true;

        // Verificar extensão do arquivo
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['shp', 'json', 'geojson', 'kml', 'zip'];

        if (!validExtensions.includes(fileExtension)) {
          this.addAlert({
            type: 'error',
            message: `Formato de arquivo não suportado. Por favor, utilize: ${validExtensions.join(', ')}`
          });
          this.$refs.fileInput.value = '';
          this.fileUploadInProgress = false;
          return;
        }

        // Importar o arquivo usando o serviço ArcGIS
        const geometryResult = await arcgisService.importGeometryFromFile(file);

        if (!geometryResult || !geometryResult.geometry) {
          throw new Error('Não foi possível processar o arquivo.');
        }

        // Verificar se o tipo de geometria importada é compatível com o tipo esperado
        const isGeometryTypeValid = this.validateGeometryType(geometryResult.geometry);
        if (!isGeometryTypeValid) {
          this.addAlert({
            type: 'error',
            message: `O tipo de geometria no arquivo não é compatível com a camada "${this.selectedLayerName}".`
          });
          this.$refs.fileInput.value = '';
          this.fileUploadInProgress = false;
          return;
        }

        // Validar a geometria importada
        const validationResult = await this.$store.dispatch('layers/validateLayerGeometry', {
          layerId: this.selectedLayer,
          geometry: geometryResult.geometry
        });

        // Mostrar mensagem de sucesso
        this.addAlert({
          type: 'success',
          message: `${this.selectedLayerName} importada com sucesso do arquivo ${file.name}.`
        });

        // Limpar o input de arquivo
        this.$refs.fileInput.value = '';
      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        this.addAlert({
          type: 'error',
          message: `Ocorreu um erro ao importar o arquivo: ${error.message || 'Erro desconhecido'}`
        });
      } finally {
        this.fileUploadInProgress = false;
      }
    },
    // Método para validar se o tipo de geometria é compatível com o tipo esperado para a camada
    validateGeometryType(geometry) {
      // Verificar se a camada existe
      if (!this.selectedLayerType) {
        return false;
      }

      // Obter o tipo esperado para a camada
      const expectedType = this.selectedLayerType.tipo_geom;

      // Verificar compatibilidade
      if (geometry.type === 'point' && expectedType === 'point') {
        return true;
      } else if (geometry.type === 'polyline' && expectedType === 'polyline') {
        return true;
      } else if ((geometry.type === 'polygon' || geometry.type === 'extent') &&
        (expectedType === 'polygonSimple' || expectedType === 'multiPolygon')) {
        return true;
      }

      // Se chegou aqui, os tipos não são compatíveis
      return false;
    },
    zoomIn() {
      arcgisService.zoomIn();
    },
    zoomOut() {
      arcgisService.zoomOut();
    },
    zoomToSelection() {
      if (!this.selectedLayer || !this.hasDrawnGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione uma camada com geometria para aplicar zoom.'
        });
        return;
      }

      const layer = this.layers.find(l => l.id === this.selectedLayer);
      if (layer && layer.geometry) {
        arcgisService.zoomToGeometry(layer.geometry);
      }
    },
    zoomToMunicipality() {
      if (!this.municipalityGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione um município primeiro.'
        });
        return;
      }

      arcgisService.zoomToGeometry(this.municipalityGeometry);
    },
    toggleLayerPanel() {
      this.showLayerPanel = !this.showLayerPanel;
      this.$emit('toggle-layer-panel', this.showLayerPanel);
    },
    formatDistance(meters) {
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
      }
      return `${meters.toFixed(2)} m`;
    },
    formatArea(squareMeters) {
      const hectares = squareMeters / 10000;
      if (hectares >= 1) {
        return `${hectares.toFixed(4)} ha`;
      }
      return `${squareMeters.toFixed(2)} m²`;
    },
    // Ferramentas de tooltips
    getPolygonTooltip() {
      if (!this.selectedLayer) return 'Selecione uma camada primeiro';
      if (!this.canDrawPolygon) return 'Esta camada não aceita polígonos';
      return 'Desenhar Polígono';
    },
    getPointTooltip() {
      if (!this.selectedLayer) return 'Selecione uma camada primeiro';
      if (!this.canDrawPoint) return 'Esta camada não aceita pontos';
      return 'Desenhar Ponto';
    },
    getLineTooltip() {
      if (!this.selectedLayer) return 'Selecione uma camada primeiro';
      if (!this.canDrawLine) return 'Esta camada não aceita linhas';
      return 'Desenhar Linha';
    },
    getEditTooltip() {
      if (!this.hasSelectedLayer) return 'Selecione uma camada primeiro';
      if (!this.hasDrawnGeometry) return 'Não há geometria para editar nesta camada';
      return 'Editar Geometria';
    },
    getEraseTooltip() {
      if (!this.hasSelectedLayer) return 'Selecione uma camada primeiro';
      if (!this.hasDrawnGeometry) return 'Não há geometria para excluir nesta camada';
      return 'Excluir Geometria';
    },
    // NOVA FUNCIONALIDADE: Ferramenta de Recorte
    prepareCutTool() {
      // Verificar se existe uma camada selecionada com geometria
      if (!this.canCutGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione uma camada com polígono para utilizar a ferramenta de recorte.'
        });
        return;
      }

      // Mostrar diálogo de confirmação
      this.cutConfirmDialogVisible = true;
    },

    startCutOperation() {
      // Fechar o diálogo de confirmação
      this.cutConfirmDialogVisible = false;

      // Atualizar estado para indicar que está no modo de recorte
      this.currentTool = 'cut';
      this.isCutting = true;

      try {
        // Obter a geometria atual da camada selecionada
        const layer = this.layers.find(l => l.id === this.selectedLayer);
        if (!layer || !layer.geometry) {
          throw new Error('Geometria não encontrada para recorte.');
        }

        // Armazenar a geometria alvo para o recorte
        this.targetGeometryForCut = layer.geometry;

        // Mostrar a geometria original com estilo de "selecionado"
        arcgisService.clearLayer(this.selectedLayer);
        const selectionSymbol = {
          type: "simple-fill",
          color: [0, 0, 255, 0.2],
          outline: {
            color: [0, 0, 255, 1],
            width: 2,
            style: "solid"
          }
        };
        arcgisService.addGraphic(this.selectedLayer, this.targetGeometryForCut, selectionSymbol);

        // Iniciar o desenho do polígono de recorte
        this.startCutDrawing();
      } catch (error) {
        console.error('Erro ao iniciar operação de recorte:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao iniciar a operação de recorte.'
        });
        this.cancelCutOperation();
      }
    },

    async startCutDrawing() {
      try {
        // Configurar o estilo do polígono de recorte
        const cutSymbol = {
          type: "simple-fill",
          color: [255, 0, 0, 0.3],
          outline: {
            color: [255, 0, 0, 1],
            width: 2,
            style: "dash"
          }
        };

        // Callback para atualização em tempo real durante o desenho
        const onUpdateGeometry = (tempGeometry) => {
          if (tempGeometry) {
            // Mostrar prévia da interseção ou subtração em tempo real
            // Isso é complexo e pode afetar o desempenho, então é opcional

            // Atualizar estilo do polígono temporário
            arcgisService.updateTempGraphicSymbol('warning');
          }
        };

        // Callback para conclusão do desenho
        const onDrawComplete = async (geometry) => {
          if (!geometry) return null;

          // Guardar a geometria de corte
          this.cutGeometry = geometry;

          // Aplicar a operação de recorte
          await this.applyCutOperation();

          return geometry;
        };

        // Iniciar o desenho do polígono de recorte
        await arcgisService.activateDrawTool('polygon', onUpdateGeometry, onDrawComplete);
      } catch (error) {
        console.error('Erro ao desenhar polígono de recorte:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao desenhar o polígono de recorte.'
        });
        this.cancelCutOperation();
      }
    },

    async applyCutOperation() {
      try {
        if (!this.targetGeometryForCut || !this.cutGeometry) {
          throw new Error('Geometrias de origem ou recorte não disponíveis.');
        }

        let resultGeometry;

        // Aplicar operação selecionada
        if (this.cutOperation === 'subtract') {
          // Recortar (subtrair a área de recorte)
          resultGeometry = arcgisService.difference(this.targetGeometryForCut, this.cutGeometry);

          // Verificar se o resultado é válido
          if (!resultGeometry) {
            this.addAlert({
              type: 'warning',
              message: 'A operação de recorte resultou em uma geometria vazia ou inválida.'
            });
            this.cancelCutOperation();
            return;
          }
        } else if (this.cutOperation === 'intersect') {
          // Interseção (manter apenas a área comum)
          resultGeometry = arcgisService.intersection(this.targetGeometryForCut, this.cutGeometry);

          // Verificar se o resultado é válido
          if (!resultGeometry) {
            this.addAlert({
              type: 'warning',
              message: 'Não há sobreposição entre a geometria original e o polígono de recorte.'
            });
            this.cancelCutOperation();
            return;
          }
        }

        // Calcular a nova área
        const newArea = arcgisService.calculateArea(resultGeometry);

        // Atualizar a geometria no store
        await this.updateLayerGeometry({
          layerId: this.selectedLayer,
          geometry: resultGeometry
        });

        // Limpar e redesenhar a camada no mapa com a nova geometria
        arcgisService.clearLayer(this.selectedLayer);
        arcgisService.addGraphic(this.selectedLayer, resultGeometry);

        // Mostrar mensagem de sucesso
        this.addAlert({
          type: 'success',
          message: `Operação de ${this.cutOperation === 'subtract' ? 'recorte' : 'interseção'} realizada com sucesso.`
        });

        // Limpar estado e voltar para o modo de navegação
        this.cleanupCutOperation();
      } catch (error) {
        console.error('Erro ao aplicar operação de recorte:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao aplicar a operação de recorte.'
        });
        this.cancelCutOperation();
      }
    },

    cancelCutOperation() {
      // Se estava no meio de uma operação de recorte
      if (this.isCutting) {
        // Restaurar a visualização original da camada
        const layer = this.layers.find(l => l.id === this.selectedLayer);
        if (layer && layer.geometry) {
          arcgisService.clearLayer(this.selectedLayer);
          arcgisService.addGraphic(this.selectedLayer, layer.geometry);
        }
      }

      this.cleanupCutOperation();
    },

    cleanupCutOperation() {
      // Limpar estado da ferramenta de recorte
      this.isCutting = false;
      this.cutGeometry = null;
      this.targetGeometryForCut = null;

      // Cancelar qualquer desenho ativo
      arcgisService.cancelDrawing();

      // Voltar para o modo de navegação
      this.currentTool = 'pan';
      arcgisService.activatePanMode();
    }
  }
};
</script>

<style lang="scss" scoped>
/* Component-specific variables */
$edit-color: #ff9800;      /* Orange for editing */
$cut-color: #f56c6c;       /* Red for cutting */
$warning-color: #e6a23c;   /* Yellow for warnings */

.map-toolbar-container {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.layer-name-card {
  position: absolute;
  top: 1px;
  left: 60px;
  z-index: 2000;
  pointer-events: auto;
}

.layer-name-header {
  background-color: white;
  color: #d2200c;
  padding: 10px 15px;
  font-weight: bold;
  text-align: left;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  display: inline-block;
  min-width: 40vw;
}

.map-toolbar {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  width: 44px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);

  &:hover {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  }
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 3px;

  &:not(:last-child) {
    padding-bottom: 10px;
    border-bottom: 1px solid #dcdfe6;
  }
}

.el-button {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto !important;
  padding: 8px !important;

  &.active {
    background-color: #409EFF;
    color: white;

    &:hover,
    &:focus {
      background-color: #337ecc;
      color: white;
    }
  }

  i {
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
}

.measurement-result {
  position: absolute;
  top: 10px;
  left: 60px;
  z-index: 1500;
  pointer-events: auto;
}

.measurement-card {
  width: 200px;

  .measurement-content {
    padding: 10px;
    display: flex;
    justify-content: center;
    font-weight: bold;
  }

  .card-header {
    display: flex;
    justify-content: center;
    font-weight: bold;
  }
}

/* Media queries for responsive design */
@media (max-width: 768px) {
  .map-toolbar-container {
    left: 5px;
  }

  .measurement-result {
    left: 50px;
  }

  .measurement-card {
    width: 180px;
  }
}

.map-toolbar .el-button {
  position: static !important;
  float: none !important;
  margin: 0 auto !important;
  left: auto !important;
  right: auto !important;
}

.delete-dialog .el-dialog {
  z-index: 99999 !important;
}

.cut-instructions {
  position: absolute;
  top: 70px;
  left: 60px;
  z-index: 2000;
  width: 300px;
  pointer-events: auto;

  .instructions-content {
    padding: 10px;
    font-size: 14px;

    p {
      margin: 5px 0;
    }
  }
}

.cut-confirm-dialog {
  .cut-options {
    margin: 20px 0;
  }

  .cut-info {
    p {
      margin: 10px 0;
    }
  }
}

/* Tool-specific styles */
.el-icon-scissors {
  transform: rotate(90deg);
}

.edit-polygon {
  cursor: move;
  
  .vertex {
    cursor: pointer;
    
    &:hover {
      fill: $edit-color;
    }
  }
}

/* Tooltip styles */
.custom-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 3000;
  pointer-events: none;
  max-width: 300px;
  transition: opacity 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  &.hidden {
    opacity: 0;
  }
}

/* Card styles for cut instructions */
.cut-instructions-card {
  background-color: rgba(255, 255, 255, 0.95);
  border: 2px solid $cut-color;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  .card-header {
    color: $cut-color;
    font-weight: bold;
  }
  
  .instructions-content {
    padding: 10px;
    font-size: 14px;
    line-height: 1.5;
    
    p {
      margin-bottom: 8px;
    }
  }
}
</style>