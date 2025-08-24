class PDIApp {
    constructor() {
        this.tipoVisualizacao = 'semestre';
        this.proximoId = 7;
        this.draggedElement = null;

        this.pontosFortes = [];
        this.acoes = [];
        this.acoesPorPeriodo = {};
        this.metricas = [];

        this.init();
    }

    /* =========================
       🔹 Inicialização
    ========================== */
    init() {
        this.bindUIEvents();
        this.loadFromStorage();
        this.render();
    }

    bindUIEvents() {
        // Botões principais
        document.getElementById('tipoVisualizacao')
            .addEventListener('change', e => {
                this.tipoVisualizacao = e.target.value;
                this.renderTimeline();
                this.saveToStorage();
            });

        document.getElementById('btnAddPontoForte')
            .addEventListener('click', () => this.showModal('modalPontoForte'));
        document.getElementById('btnAddAcao')
            .addEventListener('click', () => this.showModal('modalAcao'));

        document.getElementById('addPontoForte')
            .addEventListener('click', () => this.addPontoForte());
        document.getElementById('cancelPontoForte')
            .addEventListener('click', () => this.hideModal('modalPontoForte'));

        document.getElementById('addAcao')
            .addEventListener('click', () => this.addAcao());
        document.getElementById('cancelAcao')
            .addEventListener('click', () => this.hideModal('modalAcao'));

        // Exportar/Importar
        document.getElementById('btnExportarPDI')
            .addEventListener('click', () => this.exportJSON());
        document.getElementById('btnImportarPDI')
            .addEventListener('click', () => document.getElementById('inputImportarPDI').click());
        document.getElementById('inputImportarPDI')
            .addEventListener('change', e => this.importJSON(e));

        // Fechar modal clicando fora
        window.addEventListener('click', e => {
            if (e.target.classList.contains('modal')) e.target.style.display = 'none';
        });

        // Drag & Drop
        document.addEventListener('dragend', () => this.resetDragState());
    }

    /* =========================
       🔹 Renderização
    ========================== */
    render() {
        this.renderPontosFortes();
        this.renderTimeline();
        this.renderMetricas();
    }

    renderPontosFortes() {
        const container = document.getElementById('pontosFortes');
        container.innerHTML = this.pontosFortes.map((pf, idx) => `
            <div class="ponto-forte">
                <button class="btn-delete" data-index="${idx}">x</button>
                <h4>${pf.titulo}</h4>
                <p>${pf.descricao}</p>
            </div>
        `).join('');

        container.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', e => this.removePontoForte(e.target.dataset.index))
        );
    }

    renderTimeline() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';

        const periodos = this.getPeriodos();
        periodos.forEach(periodo => {
            const idsAcoes = this.acoesPorPeriodo[this.tipoVisualizacao]?.[periodo.id] || [];
            timeline.innerHTML += `
                <div class="periodo ${periodo.classe}" data-periodo="${periodo.id}">
                    <h4>${periodo.nome} <span class="contador-cards">(${idsAcoes.length}/4)</span></h4>
                    <div class="drop-zone" data-periodo="${periodo.id}">
                        ${idsAcoes.map(id => this.renderAcao(id)).join('')}
                    </div>
                </div>
            `;
        });

        this.bindDragAndDrop();
    }

    renderAcao(id) {
        const acao = this.acoes.find(a => a.id === id);
        if (!acao) return '';

        const prioridadeClass = acao.prioridade === 'meta' ? 'meta-principal' : `prioridade-${acao.prioridade}`;
        const prioridadeLabel = {
            alta: 'Alta',
            media: 'Média',
            baixa: 'Baixa',
            meta: 'Meta Principal'
        }[acao.prioridade];

        return `
            <div class="acao ${acao.categoria}" draggable="true" data-id="${acao.id}">
                <h5>${acao.titulo}</h5>
                <p>${acao.descricao}</p>
                <div class="acao-controles">
                    <div class="tag ${prioridadeClass}">${prioridadeLabel}</div>
                    <select class="select-prioridade" data-id="${acao.id}">
                        <option value="alta" ${acao.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                        <option value="media" ${acao.prioridade === 'media' ? 'selected' : ''}>Média</option>
                        <option value="baixa" ${acao.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                        <option value="meta" ${acao.prioridade === 'meta' ? 'selected' : ''}>Meta</option>
                    </select>
                    <button class="btn-delete-acao" data-id="${acao.id}">🗑️</button>
                </div>
            </div>
        `;
    }

    renderMetricas() {
        const container = document.getElementById('metricasContainer');
        container.innerHTML = `
            <h3>📊 Métricas de Acompanhamento</h3>
            <button class="btn btn-add" id="btnAddMetrica">Nova Métrica</button>
            ${this.metricas.map((m, idx) => `
                <div class="metrica-item">
                    <button class="btn-delete" data-index="${idx}">🗑️</button>
                    <h5>${m.titulo}</h5>
                    <p>${m.descricao.replace(/\n/g, '<br>')}</p>
                </div>
            `).join('')}
        `;

        document.getElementById('btnAddMetrica')
            .addEventListener('click', () => this.addMetrica());

        container.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', e => this.removeMetrica(e.target.dataset.index))
        );
    }

    /* =========================
       🔹 CRUD
    ========================== */
    addPontoForte() {
        const titulo = document.getElementById('tituloPF').value.trim();
        const descricao = document.getElementById('descricaoPF').value.trim();
        if (!titulo || !descricao) return alert('Preencha todos os campos.');

        this.pontosFortes.push({ titulo: `💪 ${titulo}`, descricao });
        this.hideModal('modalPontoForte');
        this.persist();
    }

    removePontoForte(index) {
        this.pontosFortes.splice(index, 1);
        this.persist();
    }

    addAcao() {
        const titulo = document.getElementById('tituloAcao').value.trim();
        const descricao = document.getElementById('descricaoAcao').value.trim();
        const categoria = document.getElementById('categoriaAcao').value;
        const prioridade = document.getElementById('prioridadeAcao').value;

        if (!titulo || !descricao) return alert('Preencha todos os campos.');

        const novaAcao = { id: this.proximoId++, titulo, descricao, categoria, prioridade };
        this.acoes.push(novaAcao);

        // Adiciona ao primeiro período com espaço
        const periodos = Object.keys(this.acoesPorPeriodo[this.tipoVisualizacao]);
        for (const periodo of periodos) {
            if (this.acoesPorPeriodo[this.tipoVisualizacao][periodo].length < 4) {
                this.acoesPorPeriodo[this.tipoVisualizacao][periodo].push(novaAcao.id);
                break;
            }
        }

        this.hideModal('modalAcao');
        this.persist();
    }

    removeAcao(id) {
        this.acoes = this.acoes.filter(a => a.id !== id);
        Object.values(this.acoesPorPeriodo).forEach(periodoMap => {
            Object.keys(periodoMap).forEach(p => {
                periodoMap[p] = periodoMap[p].filter(aid => aid !== id);
            });
        });
        this.persist();
    }

    addMetrica() {
        const titulo = prompt("Título da métrica:");
        const descricao = prompt("Descrição (use quebras de linha para separar):");
        if (!titulo || !descricao) return;
        this.metricas.push({ titulo, descricao });
        this.persist();
    }

    removeMetrica(index) {
        this.metricas.splice(index, 1);
        this.persist();
    }

    /* =========================
       🔹 Drag & Drop
    ========================== */
    bindDragAndDrop() {
        document.querySelectorAll('.acao').forEach(el => {
            el.addEventListener('dragstart', e => {
                this.draggedElement = el;
                el.classList.add('dragging');
                e.dataTransfer.setData('text/plain', el.dataset.id);
            });
        });

        document.querySelectorAll('.drop-zone').forEach(zona => {
            zona.addEventListener('dragover', e => {
                e.preventDefault();
                const periodo = zona.dataset.periodo;
                const ids = this.acoesPorPeriodo[this.tipoVisualizacao][periodo] || [];
                zona.classList.toggle('limite-atingido', ids.length >= 4);
                zona.classList.add('drag-over');
            });

            zona.addEventListener('drop', e => {
                e.preventDefault();
                if (!this.draggedElement) return;
                const acaoId = parseInt(this.draggedElement.dataset.id);
                this.moveAcaoParaPeriodo(acaoId, zona.dataset.periodo);
            });

            zona.addEventListener('dragleave', () =>
                zona.classList.remove('drag-over', 'limite-atingido'));
        });

        document.querySelectorAll('.select-prioridade').forEach(sel =>
            sel.addEventListener('change', e => {
                const acao = this.acoes.find(a => a.id === parseInt(e.target.dataset.id));
                if (acao) {
                    acao.prioridade = e.target.value;
                    this.persist();
                }
            })
        );

        document.querySelectorAll('.btn-delete-acao').forEach(btn =>
            btn.addEventListener('click', e => this.removeAcao(parseInt(e.target.dataset.id)))
        );
    }

    moveAcaoParaPeriodo(acaoId, periodoDestino) {
        const periodos = this.acoesPorPeriodo[this.tipoVisualizacao];
        Object.keys(periodos).forEach(p =>
            periodos[p] = periodos[p].filter(id => id !== acaoId)
        );

        if (!periodos[periodoDestino]) periodos[periodoDestino] = [];
        if (periodos[periodoDestino].length < 4) {
            periodos[periodoDestino].push(acaoId);
        } else {
            alert("Máximo de 4 ações por período.");
        }
        this.persist();
    }

    resetDragState() {
        document.querySelectorAll('.drop-zone')
            .forEach(z => z.classList.remove('drag-over', 'limite-atingido'));
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
    }

    /* =========================
       🔹 Utilitários
    ========================== */
    getPeriodos() {
        return this.tipoVisualizacao === 'semestre'
            ? [
                { id: '2026/1', nome: '2026/1 - Jan a Jun', classe: 'atual' },
                { id: '2026/2', nome: '2026/2 - Jul a Dez', classe: 'proximo' },
                { id: '2027/1', nome: '2027/1 - Consolidação', classe: 'futuro' }
            ]
            : [
                { id: '2026/1T', nome: '2026/1T - Jan a Mar', classe: 'atual' },
                { id: '2026/2T', nome: '2026/2T - Abr a Jun', classe: 'atual' },
                { id: '2026/3T', nome: '2026/3T - Jul a Set', classe: 'proximo' },
                { id: '2026/4T', nome: '2026/4T - Out a Dez', classe: 'proximo' },
                { id: '2027/1T', nome: '2027/1T - Jan a Mar', classe: 'futuro' },
                { id: '2027/2T', nome: '2027/2T - Abr a Jun', classe: 'futuro' }
            ];
    }

    showModal(id) {
        document.getElementById(id).style.display = 'block';
    }
    hideModal(id) {
        document.getElementById(id).style.display = 'none';
        document.querySelectorAll(`#${id} input, #${id} textarea`)
            .forEach(el => el.value = '');
    }

    /* =========================
       🔹 Persistência
    ========================== */
    saveToStorage() {
        localStorage.setItem('pdiData', JSON.stringify({
            pontosFortes: this.pontosFortes,
            acoes: this.acoes,
            acoesPorPeriodo: this.acoesPorPeriodo,
            tipoVisualizacao: this.tipoVisualizacao,
            proximoId: this.proximoId,
            metricas: this.metricas
        }));
    }

    loadFromStorage() {
        const data = localStorage.getItem('pdiData');
        if (!data) return this.initData();
        Object.assign(this, JSON.parse(data));
    }

    initData() {
        this.pontosFortes = [
            { titulo: "🗣️ Comunicação", descricao: "Boa articulação e alinhamento entre equipes" },
            { titulo: "⚡ Tomada de Decisões", descricao: "Capacidade analítica e ágil em decisões" }
        ];
        this.acoes = [];
        this.acoesPorPeriodo = { semestre: { '2026/1': [], '2026/2': [], '2027/1': [] }, trimestre: { '2026/1T': [], '2026/2T': [], '2026/3T': [], '2026/4T': [], '2027/1T': [], '2027/2T': [] } };
        this.metricas = [
            { titulo: "📚 Conhecimento Técnico", descricao: "• 2 cursos backend por semestre\n• 1 artigo técnico trimestral" }
        ];
    }

    persist() {
        this.saveToStorage();
        this.render();
    }

    /* =========================
       🔹 Exportar/Importar
    ========================== */
    exportJSON() {
        const data = localStorage.getItem('pdiData');
        if (!data) return alert("Nenhum dado para exportar.");
        const blob = new Blob([data], { type: "application/json" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "pdi.json";
        a.click();
        URL.revokeObjectURL(a.href);
    }

    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                localStorage.setItem('pdiData', e.target.result);
                this.loadFromStorage();
                this.render();
                alert("PDI importado com sucesso!");
            } catch {
                alert("Arquivo inválido.");
            }
        };
        reader.readAsText(file);
    }
}

/* Inicialização */
document.addEventListener('DOMContentLoaded', () => new PDIApp());
