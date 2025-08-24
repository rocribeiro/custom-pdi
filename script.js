// Dados do PDI
class PDI {
    constructor() {
        this.tipoVisualizacao = 'semestre';
        this.draggedElement = null;
        this.proximoId = 7;

        this.acoes = [];
        this.acoesPorPeriodo = {};
        this.pontosFortes = [];
        this.metricas = [];

        // Carrega dados do localStorage ou usa dados iniciais
        this.carregarPDI(true); // true para carregamento silencioso na inicialização
    }

    init() {
        this.setupEventListeners();
        this.renderizarTudo();
    }

    renderizarTudo() {
        document.getElementById('tipoVisualizacao').value = this.tipoVisualizacao;
        this.renderizarPontosFortes();
        this.renderizarMetricas();
        this.gerarPeriodos();
    }

    dadosIniciais() {
        this.tipoVisualizacao = 'semestre';
        this.proximoId = 7;
        this.acoes = [
            { id: 1, titulo: "🔧 Aprofundamento Backend", descricao: "Estudar arquiteturas distribuídas, microserviços e padrões de design (Strategy, Observer, Command)", categoria: "tecnico", prioridade: "alta" },
            { id: 2, titulo: "📊 1x1 com Coordenador de Produtos", descricao: "Reuniões quinzenais para entender métricas de produto, roadmap e estratégia de negócio", categoria: "produto", prioridade: "alta" },
            { id: 3, titulo: "☁️ AWS Solutions Architect", descricao: "Iniciar estudos para certificação AWS focando em arquitetura de soluções", categoria: "certificacao", prioridade: "media" },
            { id: 4, titulo: "👥 Mentoria de Juniors", descricao: "Assumir mentoria de 1-2 desenvolvedores juniors para desenvolver habilidades de liderança", categoria: "lideranca", prioridade: "media" },
            { id: 5, titulo: "🎯 Iniciar Processo de Entrevistas", descricao: "Começar aplicações para posições de coordenação técnica", categoria: "lideranca", prioridade: "meta" },
            { id: 6, titulo: "🏗️ Liderar Projeto de Arquitetura", descricao: "Propor e liderar refatoração de sistema legado aplicando novos conhecimentos", categoria: "tecnico", prioridade: "alta" }
        ];
        this.acoesPorPeriodo = {
            'semestre': { '2026/1': [1, 2, 3, 4], '2026/2': [5, 6], '2027/1': [] },
            'trimestre': { '2026/1T': [1, 2], '2026/2T': [3, 4], '2026/3T': [5], '2026/4T': [6], '2027/1T': [], '2027/2T': [] }
        };
        this.pontosFortes = [
            { titulo: "🗣️ Comunicação", descricao: "Habilidade consolidada para articulação e alinhamento entre equipes" },
            { titulo: "⚡ Tomada de Decisões", descricao: "Capacidade analítica e agilidade em decisões estratégicas" },
            { titulo: "🤝 Proximidade com Produtos", descricao: "Relacionamento estabelecido e entendimento do negócio" }
        ];
        this.metricas = [
            { titulo: '📚 Conhecimento Técnico', descricao: '• Concluir 2 cursos avançados de backend por semestre\n• Contribuir com 1 artigo técnico trimestral\n• Apresentar 1 tech talk por semestre' },
            { titulo: '🎯 Conhecimento de Produto', descricao: '• Participar de 100% das demos de produto\n• Criar 2 análises de impacto técnico-produto por mês\n• Mapear 3 principais métricas de cada squad' },
            { titulo: '👑 Liderança', descricao: '• Feedback positivo de mentorados (>4.0/5.0)\n• Liderar 2 projetos cross-funcionais\n• Obter feedback 360° trimestral' },
            { titulo: '🏆 Certificações', descricao: '• AWS Solutions Architect até Dezembro/2026\n• Avaliar necessidade de certificações adicionais\n• Manter conhecimentos atualizados' }
        ];
    }

    setupEventListeners() {
        document.getElementById('tipoVisualizacao').addEventListener('change', (e) => { this.tipoVisualizacao = e.target.value; this.gerarPeriodos(); });
        document.getElementById('btnAddPontoForte').addEventListener('click', () => this.abrirModal('modalPontoForte'));
        document.getElementById('btnAddAcao').addEventListener('click', () => this.abrirModal('modalAcao'));
        document.getElementById('btnAddMetrica').addEventListener('click', () => this.abrirModal('modalMetrica'));
        document.getElementById('btnSalvarPDI').addEventListener('click', () => this.salvarPDI());
        document.getElementById('btnCarregarPDI').addEventListener('click', () => this.carregarPDI());

        document.getElementById('addPontoForte').addEventListener('click', () => this.adicionarPontoForte());
        document.getElementById('cancelPontoForte').addEventListener('click', () => this.fecharModal('modalPontoForte'));

        document.getElementById('addAcao').addEventListener('click', () => this.adicionarAcao());
        document.getElementById('cancelAcao').addEventListener('click', () => this.fecharModal('modalAcao'));

        document.getElementById('addMetrica').addEventListener('click', () => this.adicionarMetrica());
        document.getElementById('cancelMetrica').addEventListener('click', () => this.fecharModal('modalMetrica'));

        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.fecharModal(event.target.id);
            }
        });

        document.addEventListener('dragend', () => {
            document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('drag-over', 'limite-atingido'));
            if (this.draggedElement) {
                this.draggedElement.classList.remove('dragging');
                this.draggedElement = null;
            }
        });
    }

    // --- RENDER METHODS --- //

    renderizarPontosFortes() {
        const container = document.getElementById('pontosFortesContainer');
        container.innerHTML = this.pontosFortes.map((pf, index) => `
            <div class="ponto-forte">
                <button class="btn-delete" data-index="${index}" data-type="ponto-forte">×</button>
                <h4>${pf.titulo}</h4>
                <p>${pf.descricao}</p>
            </div>
        `).join('');
        container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => this.removerItem(e, 'ponto-forte')));
    }

    renderizarMetricas() {
        const container = document.getElementById('metricasContainer');
        container.innerHTML = this.metricas.map((metrica, index) => `
            <div class="metrica-item">
                <button class="btn-delete" data-index="${index}" data-type="metrica">×</button>
                <h5>${metrica.titulo}</h5>
                <p>${metrica.descricao}</p>
            </div>
        `).join('');
        container.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => this.removerItem(e, 'metrica')));
    }

    gerarPeriodos() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';

        const periodosConfig = this.tipoVisualizacao === 'semestre'
            ? [ { id: '2026/1', nome: '2026/1 - Jan a Jun', classe: 'atual' }, { id: '2026/2', nome: '2026/2 - Jul a Dez', classe: 'proximo' }, { id: '2027/1', nome: '2027/1 - Consolidação', classe: 'futuro' } ]
            : [ { id: '2026/1T', nome: '2026/1T - Jan a Mar', classe: 'atual' }, { id: '2026/2T', nome: '2026/2T - Abr a Jun', classe: 'atual' }, { id: '2026/3T', nome: '2026/3T - Jul a Set', classe: 'proximo' }, { id: '2026/4T', nome: '2026/4T - Out a Dez', classe: 'proximo' }, { id: '2027/1T', nome: '2027/1T - Jan a Mar', classe: 'futuro' }, { id: '2027/2T', nome: '2027/2T - Abr a Jun', classe: 'futuro' } ];

        periodosConfig.forEach(periodo => {
            const periodoDiv = document.createElement('div');
            periodoDiv.className = `periodo ${periodo.classe}`;
            periodoDiv.dataset.periodo = periodo.id;
            const acoesDoPeriodo = this.acoesPorPeriodo[this.tipoVisualizacao][periodo.id] || [];
            periodoDiv.innerHTML = `
                <h4>${periodo.nome}<span class="contador-cards">(${acoesDoPeriodo.length}/4)</span></h4>
                <div class="drop-zone" data-periodo="${periodo.id}">${this.renderizarAcoes(acoesDoPeriodo)}</div>`;
            timeline.appendChild(periodoDiv);
        });

        this.configurarDragAndDrop();
    }

    renderizarAcoes(idsAcoes) {
        return idsAcoes.map(id => {
            const acao = this.acoes.find(a => a.id === id);
            if (!acao) return '';

            const prioridadeClass = `prioridade-${acao.prioridade === 'meta' ? 'meta-principal' : acao.prioridade}`;
            const prioridadeText = { alta: 'Alta Prioridade', media: 'Média Prioridade', baixa: 'Baixa Prioridade', meta: 'Meta Principal' }[acao.prioridade];

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
                </div>`;
        }).join('');
    }

    // --- EVENT & D&D CONFIG --- //

    configurarDragAndDrop() {
        document.querySelectorAll('.acao').forEach(acao => {
            acao.addEventListener('dragstart', (e) => {
                this.draggedElement = acao;
                acao.classList.add('dragging');
                e.dataTransfer.setData('text/plain', acao.dataset.id);
            });
        });

        document.querySelectorAll('.drop-zone').forEach(zona => {
            zona.addEventListener('dragover', (e) => {
                e.preventDefault();
                const acoesDoPeriodo = this.acoesPorPeriodo[this.tipoVisualizacao][zona.dataset.periodo] || [];
                const isOriginZone = acoesDoPeriodo.includes(parseInt(this.draggedElement?.dataset.id));
                zona.classList.toggle('limite-atingido', acoesDoPeriodo.length >= 4 && !isOriginZone);
                zona.classList.add('drag-over');
            });

            zona.addEventListener('dragleave', (e) => { e.target.classList.remove('drag-over', 'limite-atingido'); });

            zona.addEventListener('drop', (e) => {
                e.preventDefault();
                zona.classList.remove('drag-over', 'limite-atingido');
                if (!this.draggedElement) return;

                const acaoId = parseInt(this.draggedElement.dataset.id);
                const periodoDestino = zona.dataset.periodo;
                const acoesDoPeriodo = this.acoesPorPeriodo[this.tipoVisualizacao][periodoDestino] || [];

                if (acoesDoPeriodo.length >= 4 && !acoesDoPeriodo.includes(acaoId)) {
                    alert('Máximo de 4 cards por período!');
                    return;
                }

                Object.keys(this.acoesPorPeriodo[this.tipoVisualizacao]).forEach(p => {
                    const index = this.acoesPorPeriodo[this.tipoVisualizacao][p].indexOf(acaoId);
                    if (index > -1) this.acoesPorPeriodo[this.tipoVisualizacao][p].splice(index, 1);
                });

                if (!this.acoesPorPeriodo[this.tipoVisualizacao][periodoDestino]) {
                    this.acoesPorPeriodo[this.tipoVisualizacao][periodoDestino] = [];
                }
                this.acoesPorPeriodo[this.tipoVisualizacao][periodoDestino].push(acaoId);
                this.gerarPeriodos();
            });
        });

        document.querySelectorAll('.select-prioridade').forEach(select => select.addEventListener('change', (e) => this.alterarPrioridade(parseInt(e.target.dataset.id), e.target.value)));
        document.querySelectorAll('.btn-delete-acao').forEach(btn => btn.addEventListener('click', (e) => this.removerAcao(parseInt(e.target.dataset.id))));
    }

    // --- DATA MANIPULATION --- //

    alterarPrioridade(acaoId, novaPrioridade) {
        const acao = this.acoes.find(a => a.id === acaoId);
        if (acao) {
            acao.prioridade = novaPrioridade;
            this.gerarPeriodos();
        }
    }

    removerAcao(acaoId) {
        if (!confirm('Tem certeza que deseja remover esta ação?')) return;
        this.acoes = this.acoes.filter(a => a.id !== acaoId);
        Object.keys(this.acoesPorPeriodo).forEach(tipo => {
            Object.keys(this.acoesPorPeriodo[tipo]).forEach(periodo => {
                this.acoesPorPeriodo[tipo][periodo] = this.acoesPorPeriodo[tipo][periodo].filter(id => id !== acaoId);
            });
        });
        this.gerarPeriodos();
    }

    removerItem(event, tipo) {
        const index = parseInt(event.target.dataset.index);
        if (tipo === 'ponto-forte' && confirm('Tem certeza que deseja remover este ponto forte?')) {
            this.pontosFortes.splice(index, 1);
            this.renderizarPontosFortes();
        } else if (tipo === 'metrica' && confirm('Tem certeza que deseja remover esta métrica?')) {
            this.metricas.splice(index, 1);
            this.renderizarMetricas();
        }
    }

    adicionarPontoForte() {
        const titulo = document.getElementById('tituloPF').value.trim();
        const descricao = document.getElementById('descricaoPF').value.trim();
        if (!titulo || !descricao) return alert('Por favor, preencha todos os campos.');
        this.pontosFortes.push({ titulo: `💪 ${titulo}`, descricao });
        this.renderizarPontosFortes();
        this.fecharModal('modalPontoForte');
    }

    adicionarAcao() {
        const titulo = document.getElementById('tituloAcao').value.trim();
        const descricao = document.getElementById('descricaoAcao').value.trim();
        if (!titulo || !descricao) return alert('Por favor, preencha todos os campos.');

        const novaAcao = {
            id: this.proximoId++,
            titulo,
            descricao,
            categoria: document.getElementById('categoriaAcao').value,
            prioridade: document.getElementById('prioridadeAcao').value
        };
        this.acoes.push(novaAcao);

        const primeiroPeriodoDisponivel = Object.keys(this.acoesPorPeriodo[this.tipoVisualizacao]).find(p => this.acoesPorPeriodo[this.tipoVisualizacao][p].length < 4);
        if (primeiroPeriodoDisponivel) {
            this.acoesPorPeriodo[this.tipoVisualizacao][primeiroPeriodoDisponivel].push(novaAcao.id);
        } else {
            alert('Todos os períodos estão cheios. A ação foi adicionada mas não alocada.');
        }

        this.gerarPeriodos();
        this.fecharModal('modalAcao');
    }

    adicionarMetrica() {
        const titulo = document.getElementById('tituloMetrica').value.trim();
        const descricao = document.getElementById('descricaoMetrica').value.trim();
        if (!titulo || !descricao) return alert('Por favor, preencha todos os campos.');
        this.metricas.push({ titulo, descricao });
        this.renderizarMetricas();
        this.fecharModal('modalMetrica');
    }

    // --- MODAL & STORAGE --- //

    abrirModal(modalId) { document.getElementById(modalId).style.display = 'block'; }

    fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            const form = modal.querySelector('.modal-content');
            if(form) form.querySelectorAll('input, textarea, select').forEach(el => {
                if(el.tagName !== 'SELECT') el.value = '';
            });
        }
    }

    salvarPDI() {
        const dadosPDI = {
            pontosFortes: this.pontosFortes,
            acoes: this.acoes,
            acoesPorPeriodo: this.acoesPorPeriodo,
            metricas: this.metricas,
            tipoVisualizacao: this.tipoVisualizacao,
            proximoId: this.proximoId
        };
        localStorage.setItem('pdiData', JSON.stringify(dadosPDI));
        alert('PDI salvo com sucesso!');
    }

    carregarPDI(silencioso = false) {
        const dadosSalvos = localStorage.getItem('pdiData');
        if (dadosSalvos) {
            const dadosPDI = JSON.parse(dadosSalvos);
            this.pontosFortes = dadosPDI.pontosFortes;
            this.acoes = dadosPDI.acoes;
            this.acoesPorPeriodo = dadosPDI.acoesPorPeriodo;
            this.metricas = dadosPDI.metricas;
            this.tipoVisualizacao = dadosPDI.tipoVisualizacao;
            this.proximoId = dadosPDI.proximoId;
            if (!silencioso) {
                this.renderizarTudo();
                alert('PDI carregado com sucesso!');
            }
        } else {
            this.dadosIniciais(); // Carrega os dados default se não houver nada salvo
            if (!silencioso) alert('Nenhum PDI salvo encontrado. Carregando modelo padrão.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pdiApp = new PDI();
    window.pdiApp.init();
});