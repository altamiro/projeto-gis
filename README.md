# Sistema de Vetorização GIS

Uma aplicação web para vetorização de camadas geográficas de imóveis rurais, com validações geométricas e cálculos automáticos de áreas.

![Status do Projeto](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![Versão](https://img.shields.io/badge/Versão-1.0.0-blue)
![Licença](https://img.shields.io/badge/Licença-MIT-green)

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Requisitos de Sistema](#-requisitos-de-sistema)
- [Instalação](#-instalação)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades](#-funcionalidades)
- [Como Usar](#-como-usar)
- [Testes](#-testes)
- [Deployment](#-deployment)
- [Licença](#-licença)

## 🚀 Tecnologias

Este projeto foi desenvolvido com as seguintes tecnologias:

- **[Vue.js 2.6.14](https://v2.vuejs.org/)** - Framework frontend
- **[Pug 3.0.3](https://pugjs.org/)** - Motor de template
- **[Element-UI 2.15.14](https://element.eleme.io/)** - Biblioteca de componentes
- **[ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/)** - SDK para mapa interativo
- **[Vuex](https://vuex.vuejs.org/)** - Gerenciamento de estado
- **[Sass](https://sass-lang.com/)** - Pré-processador CSS

## 💻 Requisitos de Sistema

- **Node.js v18.x** (testado com v18.20.5)
- **npm v8.x** ou superior

## 🔧 Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/projeto-gis.git
cd projeto-gis

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run serve
```

## 📁 Estrutura do Projeto

```
projeto-gis/
├── public/                # Arquivos públicos estáticos
├── src/
│   ├── assets/            # Recursos estáticos
│   │   ├── styles/        # Arquivos SCSS
│   │   │   ├── _variables.scss   # Variáveis de estilo
│   │   │   ├── _reset.scss       # Reset CSS
│   │   │   ├── _animations.scss  # Animações
│   │   │   ├── _mixins.scss      # Mixins SCSS
│   │   │   ├── _index.scss       # Índice de módulos SCSS
│   │   │   └── global.scss       # Estilos globais
│   ├── components/        # Componentes Vue reutilizáveis
│   │   ├── MapView.vue            # Componente principal do mapa
│   │   ├── LayerSelector.vue      # Seletor de camadas
│   │   ├── DrawTools.vue          # Ferramentas de desenho
│   │   ├── AreaCalculator.vue     # Calculadora de áreas
│   │   └── ValidationAlert.vue    # Alerta de validação
│   ├── views/             # Telas da aplicação
│   │   └── GeoScreen.vue          # Tela principal de vetorização
│   ├── store/             # Gerenciamento de estado (Vuex)
│   │   ├── index.js                # Configuração da store
│   │   └── modules/
│   │       ├── property.js         # Módulo do imóvel
│   │       ├── layers.js           # Módulo de camadas
│   │       └── validation.js       # Módulo de validação
│   ├── services/          # Serviços
│   │   ├── arcgis.js               # Serviço do ArcGIS
│   │   └── validations.js          # Serviço de validações
│   ├── utils/             # Utilitários
│   │   ├── geometryOperations.js   # Operações geométricas
│   │   ├── areaCalculations.js     # Cálculos de área
│   │   └── colors.js               # Definição de cores
│   ├── App.vue            # Componente raiz
│   └── main.js            # Ponto de entrada da aplicação
├── .browserslistrc        # Configuração de compatibilidade de navegadores
├── .eslintrc.js           # Configuração do ESLint
├── .gitignore             # Arquivos ignorados pelo git
├── .nvmrc                 # Versão do Node.js
├── babel.config.js        # Configuração do Babel
├── jsconfig.json          # Configuração do JavaScript
├── package.json           # Dependências e scripts
├── vue.config.js          # Configuração do Vue CLI
└── README.md              # Este arquivo
```

## 🔍 Funcionalidades

1. **Tela Geo (Etapa Geo)**
   - Exibição de mapa de fundo do município selecionado
   - Componentização com área de visualização responsiva
   - Seleção de camadas para vetorização

2. **Vetorização da camada "Área do imóvel"**
   - Ferramentas de desenho interativo
   - Validação de interseção com o município declarado
   - Verificação de localização majoritária em São Paulo
   - Bloqueio de outras camadas até definição da área do imóvel

3. **Vetorização da camada "Sede do imóvel"**
   - Desenho apenas dentro da área do imóvel
   - Validação de não sobreposição com hidrografia
   - Alertas personalizados em caso de erro

4. **Cálculo automático da "Área líquida do imóvel"**
   - Subtração de áreas de servidão administrativa
   - Atualização automática quando alterações ocorrem

5. **Vetorização da camada "Área consolidada"**
   - Desenho exclusivamente dentro da área do imóvel
   - Validação contra sobreposição com vegetação nativa, servidões e hidrografias
   - Recorte automático quando necessário

6. **Vetorização da camada "Remanescente de vegetação nativa"**
   - Validação completa dentro do perímetro do imóvel
   - Prevenção de sobreposições não permitidas
   - Aplicação de regras de prevalência da vegetação nativa

7. **Vetorização da camada "Área de pousio"**
   - Restrição aos limites do imóvel
   - Recorte automático frente a camadas prioritárias

8. **Cálculo automático da "Área Antropizada após 2008"**
   - Fórmula automatizada com base nas demais áreas
   - Exibição em tempo real dos valores calculados

9. **Validação de cobertura completa do imóvel**
   - Verificação se toda área está coberta por pelo menos uma camada
   - Bloqueio de avanço em caso de validação negativa

10. **Exclusão de camadas vetorizadas**
    - Funcionalidade para remoção individual de camadas
    - Confirmação para ações irreversíveis

## 📝 Como Usar

1. **Iniciar a aplicação**:
   ```bash
   npm run serve
   ```

2. **Fluxo de vetorização**:
   - Selecione "Área do imóvel" no seletor de camadas
   - Utilize as ferramentas de desenho para vetorizar o perímetro
   - Proceda com as demais camadas na ordem recomendada:
     1. Área do imóvel
     2. Sede do imóvel
     3. Área consolidada
     4. Remanescente de vegetação nativa
     5. Área de pousio

3. **Verificação automática**:
   - Os cálculos de área são atualizados automaticamente
   - Alertas são exibidos quando regras de validação são violadas
   - A verificação de cobertura completa é executada continuamente

## 🧪 Testes

```bash
# Executar testes unitários
npm run test:unit

# Verificar código com ESLint
npm run lint
```

## 🚢 Deployment

Para construir o projeto para produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.