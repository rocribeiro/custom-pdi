// Dados do PDI
class PDI {
    constructor() {
        this.tipoVisualizacao = 'semestre';
        this.draggedElement = null;
        this.proximoId = 7;
        
        // Dados iniciais das ações
        this.acoes = [
            {
                id: 1,
                titulo: "🔧 Aprofundamento Backend",
                descricao: "Estudar arquiteturas distribuídas, microserviços e padrões de design (Strategy, Observer, Command)",
                categoria: "tecnico",
                prioridade: "alta"
            },
            {
                id: 2,
                titulo: "📊 1x1 com Coordenador de Produtos",
                descricao: "Reuniões quinzenais para entender métricas de produto, roadmap e estratégia de negócio",
                categoria: "produto",
                prioridade: "alta"
            },
            {
                id: 3,
                titulo: "☁️ AWS Solutions Architect",
                descricao: "Iniciar estudos para certificação AWS focando em arquitetura de soluções",
                categoria: "certificacao",
                prioridade: "media"
            },
            {
                id: 4,
                titulo: "👥 Mentoria de Juniors",
                descricao: "Assumir mentoria de 1-2 desenvolvedores juniors para desenvolver habilidades de liderança",
                categoria: "lideranca",
                prioridade: "media"
            },
            {
                id: 5,
                titulo: "🎯 Iniciar Processo de Entrevistas",
                descricao: "Começar aplicações para posições de coordenação técnica",
                categoria: "lideranca",
                prioridade: "meta"
            },
            {
                id: 6,
                titulo: "🏗️ Liderar Projeto de Arquitetura",
                descricao: "Propor e liderar refatoração de sistema legado aplicando novos conhecimentos",
                categoria: "tecnico",
                prioridade: "alta"
            }
        ];

        // Mapeamento das ações por período
        this.acoesPorPeriodo = {
            'semestre': {
                '2026/1': [1, 2, 3, 4],
                '2026/2': [5, 6],
                '2027/1': []
            },
            'trimestre': {
                '2026/1T': [1, 2],
                '2026/2T': [3, 4],
                '2026/3T': [5],
                '2026/4T': [6],
                '2027/1T': [],
                '2027/2T': []
            }
        };
        
        // Pontos fortes iniciais
        this.pontosFortes = [
            {
                titulo: "🗣️ Comunicação",
                descricao: "Habilidade consolidada para articulação e alinhamento entre equipes"
            },
            {
                titulo: "⚡ Tomada de Decisões",
                descricao: "Capacidade analítica e agilidade em decisões estratégicas"
            },
            {
                titulo: "🤝 Proximidade com Produtos",
                descricao: "Relacionamento estabelecido e entendimento do negócio"
            }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderizarPontosFortes();
        this.gerarPeriodos();
    }
    
    setupEventListeners() {
        // Visualização
        document.getElementById('tipoVisualizacao').addEventListener('change', (e) => {
            this.tipoVisualizacao = e.target.value;
            this.gerarPeriodos();
        });
        
        // Botões de adicionar
        document.getElementById('btnAddPontoForte').addEventListener('click', () => this.abrirModal('modalPontoForte'));
        document.getElementById('btnAddAcao').addEventListener('click', () => this.abrirModal('modalAcao'));
        
        // Botões de salvar/carregar
        document.getElementById('btnSalvarPDI').addEventListener('click', () => this.salvarPDI());
        document.getElementById('btnCarregarPDI').addEventListener('click', () => this.carregarPDI());
        
        // Modal Ponto Forte
        document.getElementById('addPontoForte').addEventListener('click', () => this.adicionarPontoForte());
        document.getElementById('cancelPontoForte').addEventListener('click', () => this.fecharModal('modalPontoForte'));
        
        // Modal Ação
        document.getElementById('addAcao').addEventListener('click', () => this.adicionarAcao());
        document.getElementById('cancelAcao').addEventListener('click', () => this.fecharModal('modalAcao'));
        
        // Event listeners para fechar modal clicando fora
        window.addEventListener('click', (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Event listeners para drag and drop
        document.addEventListener('dragend', () => {
            const dropZones = document.querySelectorAll('.drop-zone');
            dropZones.forEach(zone => {
                zone.classList.remove('drag-over', 'limite-atingido');
            });
            
            if (this.draggedElement) {
                this.draggedElement.classList.remove('dragging');
                this.draggedElement = null;
            }
        });
        
        document.addEventListener('dragleave', (event) => {
            if (event.target.classList.contains('drop-zone')) {
                event.target.classList.remove('drag-over', 'limite-atingido');
            }
        });
    }
    
    renderizarPontosFortes() {
        const container = document.getElementById('pontosFortes');
        container.innerHTML = '';
        
        this.pontosFortes.forEach((pontoForte, index) => {
            const div = document.createElement('div');
            div.className = 'ponto-forte';
            div.innerHTML = `
                <button class="btn-delete" data-index="${index}">×</button>
                <h4>${pontoForte.titulo}</h4>
                <p>${pontoForte.descricao}</p>
            `;
            container.appendChild(div);
        });
        
        // Adicionar event listeners para os botões de deletar
        document.querySelectorAll('.ponto-forte .btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removerPontoForte(index);
            });
        });
    }
    
    gerarPeriodos() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';

        let periodos;
        if (this.tipoVisualizacao === 'semestre') {
            periodos = [
                { id: '2026/1', nome: '2026/1 - Jan a Jun', classe: 'atual' },
                { id: '2026/2', nome: '2026/2 - Jul a Dez', classe: 'proximo' },
                { id: '2027/1', nome: '2027/1 - Consolidação', classe: 'futuro' }
            ];
        } else {
            periodos = [
                { id: '2026/1T', nome: '2026/1T - Jan a Mar', classe: 'atual' },
                { id: '2026/2T', nome: '2026/2T - Abr a Jun', classe: 'atual' },
                { id: '2026/3T', nome: '2026/3T - Jul a Set', classe: 'proximo' },
                { id: '2026/4T', nome: '2026/4T - Out a Dez', classe: 'proximo' },
                { id: '2027/1T', nome: '2027/1T - Jan a Mar', classe: 'futuro' },
                { id: '2027/2T', nome: '2027/2T - Abr a Jun', classe: 'futuro' }
            ];
        }

        periodos.forEach(periodo => {
            const periodoDiv = document.createElement('div');
            periodoDiv.className = `periodo ${periodo.classe}`;
            periodoDiv.dataset.periodo = periodo.id;

            const acoesDoPeriodo = this.acoesPorPeriodo[this.tipoVisualizacao][periodo.id] || [];
            const countCards = acoesDoPeriodo.length;

            periodoDiv.innerHTML = `
                <h4>
                    ${periodo.nome}
                    <span class="contador-cards">(${countCards}/4)</span>
                </h4>
                <div class="drop-zone" data-periodo="${periodo.id}">
                    ${this.renderizarAcoes(acoesDoPeriodo)}
                </div>
            `;

            timeline.appendChild(periodoDiv);
        });
        
        // Configurar eventos de drag and drop para as novas zonas
        this.configurarDragAndDrop();
    }
    
    renderizarAcoes(idsAcoes) {
        return idsAcoes.map(id => {
            const acao = this.acoes.find(a => a.id === id);
            if (!acao) return '';

            const prioridadeClass = `prioridade-${acao.prioridade === 'meta' ? 'meta-principal' : acao.prioridade}`;
            const prioridadeText = acao.prioridade === 'meta' ? 'Meta Principal' : 
                                 acao.prioridade === 'alta' ? 'Alta Prioridade' :
                                 acao.prioridade === 'media' ? 'Média Prioridade' : 'Baixa Prioridade';

            return `
                <div class="acao ${acao.categoria}" draggable="true" data-id="${acao.id}">
                    <h5>${acao.titulo}</h5>
                    <p>${acao.descricao}</p>
                    <div class="acao-controles">
                        <div class="tag ${prioridadeClass}">${prioridadeText}</div>
                        <select class="select-prioridade" data-id="${acao.id}">
                            <option value="alta" ${acao.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                            <option value="media" ${acao.prioridade === 'media' ? 'selected' : ''}>Média</option>
                            <option value="baixa" ${acao.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                            <option value="meta" ${acao.prioridade === 'meta' ? 'selected' : ''}>Meta</option>
                        </select>
                        <button class="btn-delete-acao" data-id="${acao.id}">×</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    configurarDragAndDrop() {
        // Configurar eventos para ações
        document.querySelectorAll('.acao').forEach(acao => {
            acao.addEventListener('dragstart', (e) => {
                this.draggedElement = acao;
                acao.classList.add('dragging');
                e.dataTransfer.setData('text/plain', acao.dataset.id);
            });
        });
        
        // Configurar eventos para zonas de drop
        document.querySelectorAll('.drop-zone').forEach(zona => {
            zona.addEventListener('dragover', (e) => {
                e.preventDefault();
                
                // Contar cards no período
                const periodo = zona.dataset.periodo;
                const acoesDoPeriodo = this.acoesPorPeriodo[this.tipoVisualizacao][periodo] || [];
                
                if (acoesDoPeriodo.length >= 4 && !acoesDoPeriodo.includes(parseInt(this.draggedElement?.dataset.id))) {
                    zona.classList.add('limite-atingido');
                } else {
                    zona.classList.add('drag-over');
                }
            });
            
            zona.addEventListener('dragleave', () => {
                zona.classList.remove('drag-over', 'limite-atingido');
            });
            
            zona.addEventListener('drop', (e) => {
                e.preventDefault();
                zona.classList.remove('drag-over', 'limite-atingido');
                
                if (!this.draggedElement) return;

                const acaoId = parseInt(this.draggedElement.dataset.id);
                const periodoDestino = zona.dataset.periodo;
                
                // Verificar limite de 4 cards
                const acoesDoPeriodo = this.acoesPorPeriodo[this.tipoVisualizacao][periodoDestino] || [];
                if (acoesDoPeriodo.length >= 4 && !acoesDoPeriodo.includes(acaoId)) {
                    alert('Máximo de 4 cards por período!');
                    this.draggedElement.classList.remove('dragging');
                    this.draggedElement = null;
                    return;
                }

                // Remover ação do período origem
                Object.keys(this.acoesPorPeriodo[this.tipoVisualizacao]).forEach(periodo => {
                    const index = this.acoesPorPeriodo[this.tipoVisualizacao][periodo].indexOf(acaoId);
                    if (index > -1) {
                        this.acoesPorPeriodo[this.tipoVisualizacao][periodo].splice(index, 1);
                    }
                });

                // Adicionar ação ao período destino
                if (!this.acoesPorPeriodo[this.tipoVisualizacao][periodoDestino]) {
                    this.acoesPorPeriodo[this.tipoVisualizacao][periodoDestino] = [];
                }
                this.acoesPorPeriodo[this.tipoVisualizacao][periodoDestino].push(acaoId);

                this.draggedElement.classList.remove('dragging');
                this.draggedElement = null;

                // Atualizar visualização
                this.gerarPeriodos();
            });
        });
        
        // Configurar eventos para alterar prioridade
        document.querySelectorAll('.select-prioridade').forEach(select => {
            select.addEventListener('change', (e) => {
                const acaoId = parseInt(e.target.dataset.id);
                const novaPrioridade = e.target.value;
                this.alterarPrioridade(acaoId, novaPrioridade);
            });
        });
        
        // Configurar eventos para remover ações
        document.querySelectorAll('.btn-delete-acao').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const acaoId = parseInt(e.target.dataset.id);
                this.removerAcao(acaoId);
            });
        });
    }
    
    alterarPrioridade(acaoId, novaPrioridade) {
        const acao = this.acoes.find(a => a.id === acaoId);
        if (acao) {
            acao.prioridade = novaPrioridade;
            this.gerarPeriodos();
        }
    }
    
    removerAcao(acaoId) {
        if (confirm('Tem certeza que deseja remover esta ação?')) {
            // Remover da lista de ações
            const index = this.acoes.findIndex(a => a.id === acaoId);
            if (index > -1) {
                this.acoes.splice(index, 1);
            }

            // Remover de todos os períodos
            Object.keys(this.acoesPorPeriodo).forEach(tipo => {
                Object.keys(this.acoesPorPeriodo[tipo]).forEach(periodo => {
                    const acaoIndex = this.acoesPorPeriodo[tipo][periodo].indexOf(acaoId);
                    if (acaoIndex > -1) {
                        this.acoesPorPeriodo[tipo][periodo].splice(acaoIndex, 1);
                    }
                });
            });

            this.gerarPeriodos();
        }
    }
    
    abrirModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }
    
    fecharModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        // Limpar formulário
        if (modalId === 'modalPontoForte') {
            document.getElementById('tituloPF').value = '';
            document.getElementById('descricaoPF').value = '';
        } else if (modalId === 'modalAcao') {
            document.getElementById('tituloAcao').value = '';
            document.getElementById('descricaoAcao').value = '';
            document.getElementById('categoriaAcao').value = 'tecnico';
            document.getElementById('prioridadeAcao').value = 'alta';
        }
    }
    
    adicionarPontoForte() {
        const titulo = document.getElementById('tituloPF').value.trim();
        const descricao = document.getElementById('descricaoPF').value.trim();

        if (!titulo || !descricao) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        this.pontosFortes.push({
            titulo: `💪 ${titulo}`,
            descricao: descricao
        });
        
        this.renderizarPontosFortes();
        this.fecharModal('modalPontoForte');
    }
    
    adicionarAcao() {
        const titulo = document.getElementById('tituloAcao').value.trim();
        const descricao = document.getElementById('descricaoAcao').value.trim();
        const categoria = document.getElementById('categoriaAcao').value;
        const prioridade = document.getElementById('prioridadeAcao').value;

        if (!titulo || !descricao) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const novaAcao = {
            id: this.proximoId++,
            titulo: titulo,
            descricao: descricao,
            categoria: categoria,
            prioridade: prioridade
        };

        this.acoes.push(novaAcao);
        
        // Adicionar ao primeiro período disponível com espaço
        let adicionado = false;
        Object.keys(this.acoesPorPeriodo[this.tipoVisualizacao]).forEach(periodo => {
            if (!adicionado && this.acoesPorPeriodo[this.tipoVisualizacao][periodo].length < 4) {
                this.acoesPorPeriodo[this.tipoVisualizacao][periodo].push(novaAcao.id);
                adicionado = true;
            }
        });

        if (!adicionado) {
            alert('Todos os períodos estão cheios (máximo 4 cards por período).');
            this.acoes.pop(); // Remove a ação que acabou de ser adicionada
            return;
        }

        this.gerarPeriodos();
        this.fecharModal('modalAcao');
    }
    
    removerPontoForte(index) {
        if (confirm('Tem certeza que deseja remover este ponto forte?')) {
            this.pontosFortes.splice(index, 1);
            this.renderizarPontosFortes();
        }
    }
    
    // Funções para salvar e carregar do banco de dados
    salvarPDI() {
        const dadosPDI = {
            pontosFortes: this.pontosFortes,
            acoes: this.acoes,
            acoesPorPeriodo: this.acoesPorPeriodo,
            tipoVisualizacao: this.tipoVisualizacao,
            proximoId: this.proximoId
        };
        
        // Aqui você implementaria a lógica para salvar no banco de dados
        // Por enquanto, vamos salvar no localStorage para demonstração
        localStorage.setItem('pdiData', JSON.stringify(dadosPDI));
        alert('PDI salvo com sucesso!');
    }
    
    carregarPDI() {
        // Aqui você implementaria a lógica para carregar do banco de dados
        // Por enquanto, vamos carregar do localStorage para demonstração
        const dadosSalvos = localStorage.getItem('pdiData');
        
        if (dadosSalvos) {
            const dadosPDI = JSON.parse(dadosSalvos);
            
            this.pontosFortes = dadosPDI.pontosFortes;
            this.acoes = dadosPDI.acoes;
            this.acoesPorPeriodo = dadosPDI.acoesPorPeriodo;
            this.tipoVisualizacao = dadosPDI.tipoVisualizacao;
            this.proximoId = dadosPDI.proximoId;
            
            // Atualizar a visualização
            document.getElementById('tipoVisualizacao').value = this.tipoVisualizacao;
            this.renderizarPontosFortes();
            this.gerarPeriodos();
            
            alert('PDI carregado com sucesso!');
        } else {
            alert('Nenhum PDI salvo encontrado.');
        }
    }
}

// Inicializar a aplicação quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.pdiApp = new PDI();
});