import axios from 'axios';

/**
 * Serviço HTTP para gerenciar requisições usando Axios
 */
class HttpService {
  /**
   * Construtor do serviço
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {baseURL: 'http://localhost:9291/car-online/api'}) {
    this.baseURL = options.baseURL || process.env.VUE_APP_API_URL || '/api';
    this.timeout = options.timeout || 30000;
    this.headers = options.headers || {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Criar instância do axios com configuração padrão
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: this.headers
    });

    // Configurar interceptors
    this._setupInterceptors();
  }

  /**
   * Configura interceptadores de requisição e resposta
   * @private
   */
  _setupInterceptors() {
    // Interceptador de requisição
    this.axiosInstance.interceptors.request.use(
      config => {
        // Adicionar token de autenticação se disponível
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Interceptador de resposta
    this.axiosInstance.interceptors.response.use(
      response => {
        // Tratar resposta de sucesso
        return response.data;
      },
      error => {
        // Tratar erros de resposta
        if (error.response) {
          // O servidor respondeu com um status de erro
          const status = error.response.status;

          // Tratar erros específicos
          if (status === 401) {
            // Não autorizado - redirecionar para login ou renovar token
            console.warn('Não autorizado. Redirecionando para login...');
            localStorage.removeItem('token');
            // Redirecionar para login ou disparar evento global
          } else if (status === 403) {
            // Acesso proibido
            console.warn('Acesso proibido ao recurso solicitado.');
          } else if (status === 404) {
            // Recurso não encontrado
            console.warn('Recurso não encontrado:', error.config.url);
          } else if (status >= 500) {
            // Erro do servidor
            console.error('Erro do servidor:', error.response.data);
          }
        } else if (error.request) {
          // A requisição foi feita mas não houve resposta
          console.error('Sem resposta do servidor:', error.request);
        } else {
          // Erro ao configurar a requisição
          console.error('Erro na configuração da requisição:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Realiza uma requisição GET
   * @param {string} url - URL da requisição
   * @param {Object} params - Parâmetros da query string
   * @param {Object} config - Configurações adicionais
   * @returns {Promise} Promessa com a resposta
   */
  get(url, params = {}, config = {}) {
    return this.axiosInstance.get(url, { ...config, params });
  }

  /**
   * Realiza uma requisição POST
   * @param {string} url - URL da requisição
   * @param {Object} data - Dados a serem enviados
   * @param {Object} config - Configurações adicionais
   * @returns {Promise} Promessa com a resposta
   */
  post(url, data = {}, config = {}) {
    return this.axiosInstance.post(url, data, config);
  }

  /**
   * Realiza uma requisição PUT
   * @param {string} url - URL da requisição
   * @param {Object} data - Dados a serem enviados
   * @param {Object} config - Configurações adicionais
   * @returns {Promise} Promessa com a resposta
   */
  put(url, data = {}, config = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  /**
   * Realiza uma requisição PATCH
   * @param {string} url - URL da requisição
   * @param {Object} data - Dados a serem enviados
   * @param {Object} config - Configurações adicionais
   * @returns {Promise} Promessa com a resposta
   */
  patch(url, data = {}, config = {}) {
    return this.axiosInstance.patch(url, data, config);
  }

  /**
   * Realiza uma requisição DELETE
   * @param {string} url - URL da requisição
   * @param {Object} config - Configurações adicionais
   * @returns {Promise} Promessa com a resposta
   */
  delete(url, config = {}) {
    return this.axiosInstance.delete(url, config);
  }

  /**
   * Realiza múltiplas requisições concorrentes
   * @param {Array} requests - Array de promessas/requisições
   * @returns {Promise} Promessa com as respostas
   */
  all(requests) {
    return axios.all(requests);
  }

  /**
   * Faz o upload de arquivos
   * @param {string} url - URL da requisição
   * @param {FormData} formData - FormData contendo os arquivos
   * @param {Object} config - Configurações adicionais
   * @returns {Promise} Promessa com a resposta
   */
  upload(url, formData, config = {}) {
    const uploadConfig = {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: progressEvent => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (config.onProgress) {
          config.onProgress(percentCompleted);
        }
      }
    };

    return this.axiosInstance.post(url, formData, uploadConfig);
  }

  /**
   * Faz o download de arquivos
   * @param {string} url - URL da requisição
   * @param {Object} params - Parâmetros da query string
   * @param {Object} config - Configurações adicionais
   * @returns {Promise} Promessa com a resposta
   */
  download(url, params = {}, config = {}) {
    const downloadConfig = {
      ...config,
      responseType: 'blob',
      params
    };

    return this.axiosInstance.get(url, downloadConfig);
  }

  /**
   * Define um token de autenticação para todas as requisições
   * @param {string} token - Token de autenticação
   */
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('token', token);
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Cria uma nova instância do serviço com configurações diferentes
   * @param {Object} options - Opções de configuração
   * @returns {HttpService} Nova instância do serviço
   */
  createInstance(options = {}) {
    return new HttpService(options);
  }
}

// Exportar uma instância padrão do serviço
export default new HttpService();