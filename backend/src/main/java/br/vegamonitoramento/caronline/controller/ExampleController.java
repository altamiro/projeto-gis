package br.vegamonitoramento.caronline.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootVersion;
import org.springframework.core.SpringVersion;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/example")
@Tag(name = "Example", description = "API de exemplo para demonstração do OpenAPI")
public class ExampleController {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    private Map<String, String> dependencyVersions = null;

    @Operation(summary = "Obter informações do sistema", description = "Retorna informações básicas sobre o sistema CAR Online")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Operação bem sucedida", 
                    content = { @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = Map.class)) }),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", "CAR Online");
        info.put("version", "1.0.0");
        info.put("status", "active");
        info.put("environment", "development");
        
        // Adicionar versão do Spring Boot
        String bootVersion = SpringBootVersion.getVersion();
        info.put("springBootVersion", bootVersion);
        
        // Adicionar informações do PostgreSQL
        try {
            String postgresVersion = jdbcTemplate.queryForObject(
                "SELECT version()", String.class);
            info.put("postgresVersion", postgresVersion);
        } catch (Exception e) {
            info.put("postgresVersion", "Error retrieving PostgreSQL version: " + e.getMessage());
        }
        
        // Adicionar informações do PostGIS
        try {
            String postgisVersion = jdbcTemplate.queryForObject(
                "SELECT postgis_full_version()", String.class);
            info.put("postgisVersion", postgisVersion);
        } catch (Exception e) {
            info.put("postgisVersion", "Error retrieving PostGIS version: " + e.getMessage());
        }
        
        // Adicionar informações das dependências lendo o pom.xml
        if (dependencyVersions == null) {
            dependencyVersions = readDependencyVersionsFromPom();
        }
        info.put("dependencies", dependencyVersions);
        
        // Adicionar informações de runtime
        Map<String, String> runtimeInfo = new HashMap<>();
        runtimeInfo.put("Java Version", System.getProperty("java.version"));
        runtimeInfo.put("Java Vendor", System.getProperty("java.vendor"));
        runtimeInfo.put("OS Name", System.getProperty("os.name"));
        runtimeInfo.put("OS Version", System.getProperty("os.version"));
        runtimeInfo.put("OS Architecture", System.getProperty("os.arch"));
        runtimeInfo.put("User Locale", System.getProperty("user.language") + "_" + System.getProperty("user.country"));
        info.put("runtime", runtimeInfo);
        
        return ResponseEntity.ok(info);
    }
    
    private Map<String, String> readDependencyVersionsFromPom() {
        Map<String, String> versions = new HashMap<>();
        
        try {
            // Tentar vários caminhos possíveis para o pom.xml
            String pomContent = null;
            
            // Opção 1: Tentar ler do classpath (se estiver incluído no jar)
            try {
                Resource resource = new ClassPathResource("META-INF/maven/br.vegamonitoramento/caronline/pom.xml");
                if (resource.exists()) {
                    InputStream inputStream = resource.getInputStream();
                    pomContent = new String(inputStream.readAllBytes());
                    inputStream.close();
                }
            } catch (Exception e) {
                // Falha silenciosa, tentaremos outro método
            }
            
            // Opção 2: Tentar ler do sistema de arquivos relativo ao diretório de trabalho
            if (pomContent == null) {
                try {
                    File pomFile = new File("pom.xml");
                    if (pomFile.exists()) {
                        pomContent = new String(Files.readAllBytes(pomFile.toPath()));
                    } else {
                        pomFile = new File("pom.xml");
                        if (pomFile.exists()) {
                            pomContent = new String(Files.readAllBytes(pomFile.toPath()));
                        }
                    }
                } catch (Exception e) {
                    // Falha silenciosa
                }
            }
            
            if (pomContent != null) {
                // Parsear o conteúdo XML do pom.xml
                DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                DocumentBuilder builder = factory.newDocumentBuilder();
                Document doc = builder.parse(new java.io.ByteArrayInputStream(pomContent.getBytes()));
                
                // Extrair versão do projeto
                NodeList projectVersionNodes = doc.getElementsByTagName("version");
                if (projectVersionNodes.getLength() > 0) {
                    versions.put("Project Version", projectVersionNodes.item(0).getTextContent());
                }
                
                // Extrair versão do Spring Boot
                NodeList parentNodes = doc.getElementsByTagName("parent");
                if (parentNodes.getLength() > 0) {
                    Node parentNode = parentNodes.item(0);
                    NodeList childNodes = parentNode.getChildNodes();
                    for (int i = 0; i < childNodes.getLength(); i++) {
                        Node node = childNodes.item(i);
                        if (node.getNodeType() == Node.ELEMENT_NODE) {
                            Element element = (Element) node;
                            if (element.getTagName().equals("version") && 
                                    parentNode.getTextContent().contains("spring-boot")) {
                                versions.put("Spring Boot", element.getTextContent());
                            }
                        }
                    }
                }
                
                // Extrair versões específicas de propriedades
                NodeList propertiesNodes = doc.getElementsByTagName("properties");
                if (propertiesNodes.getLength() > 0) {
                    Node propertiesNode = propertiesNodes.item(0);
                    NodeList propertyNodes = propertiesNode.getChildNodes();
                    for (int i = 0; i < propertyNodes.getLength(); i++) {
                        Node node = propertyNodes.item(i);
                        if (node.getNodeType() == Node.ELEMENT_NODE) {
                            Element element = (Element) node;
                            String propertyName = element.getTagName();
                            String propertyValue = element.getTextContent();
                            
                            // Mapear propriedades para nomes mais amigáveis
                            if (propertyName.equals("java.version")) {
                                versions.put("Java", propertyValue);
                            } else if (propertyName.equals("springdoc.version")) {
                                versions.put("SpringDoc OpenAPI", propertyValue);
                            } else if (propertyName.contains("version")) {
                                // Outras propriedades de versão
                                String formattedName = propertyName
                                        .replace(".version", "")
                                        .replace("-version", "");
                                versions.put(formattedName, propertyValue);
                            }
                        }
                    }
                }
                
                // Extrair versões das dependências
                NodeList dependencyNodes = doc.getElementsByTagName("dependency");
                for (int i = 0; i < dependencyNodes.getLength(); i++) {
                    Node dependencyNode = dependencyNodes.item(i);
                    NodeList childNodes = dependencyNode.getChildNodes();
                    
                    String groupId = null;
                    String artifactId = null;
                    String version = null;
                    
                    for (int j = 0; j < childNodes.getLength(); j++) {
                        Node node = childNodes.item(j);
                        if (node.getNodeType() == Node.ELEMENT_NODE) {
                            Element element = (Element) node;
                            if (element.getTagName().equals("groupId")) {
                                groupId = element.getTextContent();
                            } else if (element.getTagName().equals("artifactId")) {
                                artifactId = element.getTextContent();
                            } else if (element.getTagName().equals("version")) {
                                version = element.getTextContent();
                            }
                        }
                    }
                    
                    if (groupId != null && artifactId != null) {
                        // Formatar o nome da dependência
                        String dependencyName = artifactId;
                        
                        // Especiais que queremos um nome mais amigável
                        if (artifactId.equals("hibernate-core")) {
                            dependencyName = "Hibernate Core";
                        } else if (artifactId.equals("hibernate-spatial")) {
                            dependencyName = "Hibernate Spatial";
                        } else if (artifactId.equals("hibernate-community-dialects")) {
                            dependencyName = "Hibernate Community Dialects";
                        } else if (artifactId.equals("postgresql")) {
                            dependencyName = "PostgreSQL Driver";
                        } else if (artifactId.equals("jts-core")) {
                            dependencyName = "JTS Core";
                        } else if (artifactId.equals("geolatte-geom")) {
                            dependencyName = "Geolatte Geom";
                        } else if (artifactId.equals("lombok")) {
                            dependencyName = "Lombok";
                        } else if (artifactId.contains("spring-boot")) {
                            dependencyName = "Spring Boot " + artifactId.replace("spring-boot-", "");
                        } else if (artifactId.contains("springdoc")) {
                            dependencyName = "SpringDoc " + artifactId.replace("springdoc-", "");
                        }
                        
                        // Só adicionar se tiver versão explícita
                        if (version != null && !version.isEmpty()) {
                            // Resolver referência a propriedade se necessário
                            if (version.startsWith("${") && version.endsWith("}")) {
                                String propertyName = version.substring(2, version.length() - 1);
                                String resolvedVersion = versions.get(propertyName);
                                if (resolvedVersion != null) {
                                    version = resolvedVersion;
                                }
                            }
                            versions.put(dependencyName, version);
                        } else {
                            versions.put(dependencyName, "Sem versão explicitada.");
                        }
                    }
                }
            } else {
                // Se não conseguiu ler o pom.xml, fornecer valores padrão
                versions.put("Erro", "Não foi possível ler o arquivo pom.xml");
                versions.put("Spring Boot", SpringBootVersion.getVersion());
                versions.put("Spring Framework", SpringVersion.getVersion());
            }
            
        } catch (Exception e) {
            versions.put("Erro", "Exceção ao ler o pom.xml: " + e.getMessage());
        }
        
        return versions;
    }

    @Operation(summary = "Obter status por ID", description = "Retorna o status de um elemento específico pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Elemento encontrado"),
            @ApiResponse(responseCode = "404", description = "Elemento não encontrado")
    })
    @GetMapping("/status/{id}")
    public ResponseEntity<String> getStatus(
            @Parameter(description = "ID do elemento", required = true) @PathVariable Long id) {
        // Lógica simulada
        if (id > 0 && id < 100) {
            return ResponseEntity.ok("Active");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}