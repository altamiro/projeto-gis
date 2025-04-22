package br.vegamonitoramento.caronline.service;

import br.vegamonitoramento.caronline.model.dto.TemaGrupoDTO;
import br.vegamonitoramento.caronline.repository.TemaGrupoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class TemaGrupoService {

    private final TemaGrupoRepository temaGrupoRepository;

    @Autowired
    public TemaGrupoService(TemaGrupoRepository temaGrupoRepository) {
        this.temaGrupoRepository = temaGrupoRepository;
    }

    public List<TemaGrupoDTO> getAllTemasGrupos() {
        return temaGrupoRepository.findAllTemasGrupos();
    }
    
    public Map<String, List<TemaGrupoDTO>> getAllTemasGruposAgrupados() {
        return temaGrupoRepository.findAllTemasGruposAgrupados();
    }
}