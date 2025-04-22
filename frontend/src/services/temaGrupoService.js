import httpService from '../utils/httpService';

/**
 * Serviço para consulta de temas e grupos conforme API do backend
 */
class TemaGrupoService {
  /**
   * Construtor do serviço
   */
  constructor() {
    this.basePath = '/temas-grupos';
  }

  /**
   * Recupera todos os temas e grupos
   * @returns {Promise} Promessa com a lista de temas e grupos
   */
  getAllTemasGrupos() {
    return httpService.get(this.basePath);
  }

  /**
   * Recupera os temas e grupos agrupados por chave composta no formato 'codOrdem_nomGrupo'
   * @returns {Promise} Promessa com os temas agrupados
   */
  getAllTemasGruposAgrupados() {
    return httpService.get(`${this.basePath}/agrupados`);
  }
}

// Exportar uma instância padrão do serviço
export default new TemaGrupoService();