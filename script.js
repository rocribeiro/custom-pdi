const PALETA_DE_CORES = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#78716c'
];

class PDI {
    constructor() {
        this.tipoVisualizacao = 'semestre';
        this.proximoId = 100;
        this.itemParaExcluir = null;
        this.itemEmEdicao = null;
        this.acaoEmEdicaoId = null;
        this.categoriaEmEdicao = null;
        this.autosaveEnabled = true;
        this.acoes = [];
        this.pontosFortes = [];
        this.pontosDeMelhoria = [];
        this.metricas = [];
        this.config = {};
        this.carregarPDI(true);
        this.criarModaisDinamicos();
        this.setupEventListeners();
    }

    init() {
        this.renderizarTudo();
        document.getElementById('autosaveToggle').checked = this.autosaveEnabled;
    }
    renderizarTudo() {
        this.aplicarConfiguracoes();
        this.renderizarComponentesEstaticos();
        this.renderizarTimeline();
        this.renderizarObjetivoEProgresso();
    }

    dadosIniciais() {
        this.proximoId = 1;
        this.acoes = [];
        this.pontosFortes = [];
        this.pontosDeMelhoria = [];
        this.metricas = [];
        this.config = {
            anosVisiveis: 3,
            cores: { tecnico: PALETA_DE_CORES[7], produto: PALETA_DE_CORES[8], lideranca: PALETA_DE_CORES[0], certificacao: PALETA_DE_CORES[1] }
        };
    }

    aplicarConfiguracoes() { Object.entries(this.config.cores).forEach(([cat, cor]) => document.documentElement.style.setProperty(`--cat-${cat}`, cor)); if (document.getElementById('selectAnosVisiveis')) { document.getElementById('selectAnosVisiveis').value = this.config.anosVisiveis; } }

    setupEventListeners() {
        document.getElementById('tipoVisualizacao').addEventListener('change', e => { this.tipoVisualizacao = e.target.value; this.renderizarTimeline(); this.autosave(); });
        document.getElementById('selectAnosVisiveis').addEventListener('change', e => { this.config.anosVisiveis = parseInt(e.target.value); this.renderizarTimeline(); this.autosave(); });

        // Lógica do novo menu de exportação
        const btnAbrirExport = document.getElementById('btnAbrirExport');
        const exportMenu = document.getElementById('exportMenu');

        btnAbrirExport.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede o clique de fechar o menu imediatamente
            exportMenu.classList.toggle('show');
        });

        document.getElementById('btnExportarPDFMenu').addEventListener('click', (e) => {
            e.preventDefault();
            window.print();
            exportMenu.classList.remove('show');
        });

        document.getElementById('btnExportarPDIMenu').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportarPDI();
            exportMenu.classList.remove('show');
        });

        // Fecha o menu se o usuário clicar em qualquer outro lugar da tela
        window.addEventListener('click', (event) => {
            if (!event.target.matches('#btnAbrirExport')) {
                if (exportMenu.classList.contains('show')) {
                    exportMenu.classList.remove('show');
                }
            }
        });

        const fileUploader = document.getElementById('fileUploader');
        document.getElementById('btnCarregarPDI').addEventListener('click', () => fileUploader.click());
        fileUploader.addEventListener('change', e => this.carregarArquivo(e));
        document.getElementById('colorPalettePopup').addEventListener('click', e => { if (e.target.classList.contains('palette-color')) this.selecionarCor(e.target.dataset.color); });
        window.addEventListener('click', e => { const popup = document.getElementById('colorPalettePopup'); if (popup && !popup.contains(e.target) && !e.target.classList.contains('legenda-cor')) { this.fecharPaletaDeCores(); } });
        const modalContainer = document.getElementById('modal-container');
        modalContainer.addEventListener('click', e => {
            if (e.target.matches('.btn-cancel') || e.target.matches('.modal')) { const modal = e.target.closest('.modal'); if (modal) this.fecharModal(modal.id); }
            if (e.target.id === 'confirmExclusaoItem') this.confirmarExclusaoItem();
            if (e.target.id === 'saveAcaoBtn') this.salvarAcao();
            if (e.target.id === 'saveItemBtn') this.salvarItem();
        });

        document.getElementById('autosaveToggle').addEventListener('change', e => {
            this.autosaveEnabled = e.target.checked;
            if (this.autosaveEnabled) {
                this.autosave();
                console.log("Auto-save ativado.");
            } else {
                console.log("Auto-save desativado.");
            }
        });
    }

    renderizarObjetivoEProgresso() {
        if (this.acoes.length === 0) {
            document.querySelector('.progress-fill').style.width = '0%';
            document.querySelector('.progress-text').textContent = 'Adicione ações para iniciar o acompanhamento.';
            return;
        }

        const datasInicio = this.acoes.map(a => new Date(a.dataInicio + '-01T00:00:00'));
        const datasFim = this.acoes.map(a => {
            const [ano, mes] = a.dataFim.split('-');
            return new Date(ano, mes, 0);
        });

        const dataInicioPDI = new Date(Math.min.apply(null, datasInicio));
        const dataFimPDI = new Date(Math.max.apply(null, datasFim));
        const hoje = new Date();

        if (hoje < dataInicioPDI) {
            document.querySelector('.progress-fill').style.width = '0%';
            document.querySelector('.progress-text').textContent = 'Jornada planejada para começar.';
            return;
        }
        if (hoje > dataFimPDI) {
            document.querySelector('.progress-fill').style.width = '100%';
            document.querySelector('.progress-text').textContent = 'Jornada concluída!';
            return;
        }

        const duracaoTotal = dataFimPDI.getTime() - dataInicioPDI.getTime();
        const tempoPercorrido = hoje.getTime() - dataInicioPDI.getTime();

        let progresso = (tempoPercorrido / duracaoTotal) * 100;
        progresso = Math.min(100, Math.max(0, progresso));

        document.querySelector('.progress-fill').style.width = `${progresso.toFixed(2)}%`;
        document.querySelector('.progress-text').textContent = `Progresso: ${progresso.toFixed(0)}% do caminho percorrido`;
    }

    renderizarComponentesEstaticos() { this.renderizarPontosFortes(); this.renderizarPontosDeMelhoria(); this.renderizarMetricas(); this.renderizarLegenda(); }

    adicionarBotaoContextual(secaoId, callback) {
        const header = document.querySelector(`${secaoId} h3`);
        if (!header) return;
        header.querySelector('.btn-add-contextual')?.remove();
        const button = document.createElement('button');
        button.className = 'btn-add-contextual';
        button.innerHTML = '+';
        button.addEventListener('click', callback);
        header.appendChild(button);
    }

    renderizarLegenda() { const container = document.getElementById('legendaContainer'); container.innerHTML = Object.keys(this.config.cores).map(key => `<div class="legenda-item"><div class="legenda-cor" style="background: var(--cat-${key});" data-categoria="${key}"></div><span>${key.charAt(0).toUpperCase() + key.slice(1)}</span></div>`).join(''); container.querySelectorAll('.legenda-cor').forEach(el => el.addEventListener('click', e => this.abrirPaletaDeCores(e.target))); }
    abrirPaletaDeCores(elementoClicado) { this.categoriaEmEdicao = elementoClicado.dataset.categoria; const popup = document.getElementById('colorPalettePopup'); popup.innerHTML = PALETA_DE_CORES.map(cor => `<div class="palette-color" style="background-color: ${cor}" data-color="${cor}"></div>`).join(''); const rect = elementoClicado.getBoundingClientRect(); popup.style.top = `${window.scrollY + rect.bottom + 8}px`; popup.style.left = `${window.scrollX + rect.left - 48}px`; popup.style.display = 'grid'; }
    fecharPaletaDeCores() { const popup = document.getElementById('colorPalettePopup'); if (popup) popup.style.display = 'none'; this.categoriaEmEdicao = null; }
    selecionarCor(novaCor) { if (this.categoriaEmEdicao) { this.config.cores[this.categoriaEmEdicao] = novaCor; this.aplicarConfiguracoes(); this.renderizarLegenda(); this.renderizarTimeline(); this.autosave(); } }
    renderizarTimeline() { this.adicionarBotaoContextual('#secaoCronograma', () => this.abrirModalAcaoParaAdicionar()); const headerContainer = document.getElementById('timeline-header'); const bodyContainer = document.getElementById('timeline-body'); headerContainer.innerHTML = ''; bodyContainer.innerHTML = ''; const anoAtual = new Date().getFullYear(); let anoDeInicio = anoAtual; if (this.acoes.length > 0) { const anosDasAcoes = this.acoes.filter(a => a.dataInicio).map(a => parseInt(a.dataInicio.substring(0, 4))); if (anosDasAcoes.length > 0) { const anoMinimo = Math.min(...anosDasAcoes); anoDeInicio = isNaN(anoMinimo) ? anoAtual : anoMinimo; } } const periodosConfig = []; for (let i = 0; i < this.config.anosVisiveis; i++) { const ano = anoDeInicio + i; if (this.tipoVisualizacao === 'semestre') { periodosConfig.push({ id: `${ano}/1`, nome: `${ano}/1` }, { id: `${ano}/2`, nome: `${ano}/2` }); } else { for (let t = 1; t <= 4; t++) periodosConfig.push({ id: `${ano}/${t}T`, nome: `${String(ano).slice(2)}/${t}T` }); } } const gridCols = `repeat(${periodosConfig.length}, 1fr)`; headerContainer.style.gridTemplateColumns = gridCols; bodyContainer.style.gridTemplateColumns = gridCols; periodosConfig.forEach(p => { headerContainer.innerHTML += `<div class="timeline-period-header"><span>${p.nome}</span></div>`; }); const hoje = new Date(); const periodoHojeKey = this.getPeriodoKey(hoje, this.tipoVisualizacao); const hojeIndex = periodosConfig.findIndex(p => p.id === periodoHojeKey); if (hojeIndex !== -1) { const { inicio, fim } = this.getPeriodoDatas(periodoHojeKey); const totalDiasPeriodo = (fim - inicio) / (1000 * 60 * 60 * 24) + 1; const diasDesdeInicio = (hoje - inicio) / (1000 * 60 * 60 * 24); const percentualNoPeriodo = Math.max(0, diasDesdeInicio / totalDiasPeriodo); const larguraColuna = 100 / periodosConfig.length; const posicaoHorizontal = (hojeIndex * larguraColuna) + (percentualNoPeriodo * larguraColuna); bodyContainer.innerHTML += `<div class="timeline-hoje-linha" style="left: ${posicaoHorizontal}%;"></div>`; } this.renderizarAcoes(periodosConfig, bodyContainer); }
    renderizarAcoes(periodosConfig, container) { const rowsLayout = []; const acoesOrdenadas = [...this.acoes].sort((a, b) => { if (!a.dataInicio || !b.dataInicio) return 0; return new Date(a.dataInicio + '-01') - new Date(b.dataInicio + '-01'); }); acoesOrdenadas.forEach(acao => { const { colStart, colEnd } = this.calcularPosicaoAcao(acao, periodosConfig); if (colStart === -1) return; let rowStart = 1; while (true) { let isTaken = false; for (let i = colStart; i < colEnd; i++) { if (rowsLayout[i] && rowsLayout[i][rowStart]) { isTaken = true; break; } } if (!isTaken) break; rowStart++; } for (let i = colStart; i < colEnd; i++) { if (!rowsLayout[i]) rowsLayout[i] = {}; rowsLayout[i][rowStart] = true; } const acaoDiv = document.createElement('div'); acaoDiv.className = `acao ${acao.categoria}`; acaoDiv.style.gridColumn = `${colStart} / ${colEnd}`; acaoDiv.style.setProperty('--row-start', rowStart); acaoDiv.innerHTML = `<div class="acao-content"><h5>${acao.titulo}</h5>${acao.descricao ? `<p>${acao.descricao}</p>` : ''}</div><button class="btn-delete-acao" data-id="${acao.id}">×</button>`; container.appendChild(acaoDiv); acaoDiv.addEventListener('click', () => this.abrirModalAcaoParaEdicao(acao.id)); acaoDiv.querySelector('.btn-delete-acao').addEventListener('click', e => { e.stopPropagation(); this.abrirModalExclusaoItem('acao', acao.id, acao.titulo); }); }); }
    getPeriodoKey(date, tipo) { if (!date) return null; const year = date.getFullYear(); const month = date.getMonth() + 1; if (tipo === 'semestre') return `${year}/${month <= 6 ? 1 : 2}`; else { const q = Math.ceil(month / 3); return `${year}/${q}T`; } }
    getPeriodoDatas(key) { const [y, p] = key.split('/'); if (p.includes('T')) { const q = parseInt(p.replace('T', '')); const m = (q - 1) * 3; return { inicio: new Date(y, m, 1), fim: new Date(y, m + 3, 0) }; } else { const s = parseInt(p); const m = (s - 1) * 6; return { inicio: new Date(y, m, 1), fim: new Date(y, m + 6, 0) }; } }
    calcularPosicaoAcao(acao, periodosConfig) { if (!acao.dataInicio || !acao.dataFim) return { colStart: -1 }; const inicio = new Date(acao.dataInicio + '-01T00:00:00'); const [fimAno, fimMes] = acao.dataFim.split('-'); const fim = new Date(fimAno, fimMes, 0); const startKey = this.getPeriodoKey(inicio, this.tipoVisualizacao); const endKey = this.getPeriodoKey(fim, this.tipoVisualizacao); const startIndex = periodosConfig.findIndex(p => p.id === startKey); let endIndex = periodosConfig.findIndex(p => p.id === endKey); if (startIndex === -1 && endIndex === -1) return { colStart: -1 }; const finalStartIndex = startIndex === -1 ? 0 : startIndex; const finalEndIndex = endIndex === -1 ? periodosConfig.length - 1 : endIndex; return { colStart: finalStartIndex + 1, colEnd: finalEndIndex + 2 }; }

    abrirModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.style.display = 'block'; }
    fecharModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.style.display = 'none'; }

    abrirModalAcaoParaAdicionar() { this.acaoEmEdicaoId = null; const modal = document.getElementById('modalAcao'); modal.querySelector('#modalAcaoHeader').textContent = 'Adicionar Nova Ação'; modal.querySelector('#tituloAcao').value = ''; modal.querySelector('#descricaoAcao').value = ''; modal.querySelector('#saveAcaoBtn').textContent = 'Adicionar'; this.popularSeletoresDeData(modal, null); this.abrirModal('modalAcao'); }
    abrirModalAcaoParaEdicao(id) { this.acaoEmEdicaoId = id; const acao = this.acoes.find(a => a.id === id); if (!acao) return; const modal = document.getElementById('modalAcao'); modal.querySelector('#modalAcaoHeader').textContent = 'Editar Ação'; modal.querySelector('#tituloAcao').value = acao.titulo; modal.querySelector('#descricaoAcao').value = acao.descricao || ''; modal.querySelector('#categoriaAcao').value = acao.categoria; modal.querySelector('#saveAcaoBtn').textContent = 'Salvar Alterações'; this.popularSeletoresDeData(modal, acao); this.abrirModal('modalAcao'); }
    popularSeletoresDeData(modal, acao, datasPredefinidas = null) { const anoAtual = new Date().getFullYear(); const anoFim = anoAtual + 5; const seletorAnoInicio = modal.querySelector('#anoInicio'); const seletorAnoFim = modal.querySelector('#anoFim'); seletorAnoInicio.innerHTML = ''; seletorAnoFim.innerHTML = ''; for (let i = anoAtual - 2; i <= anoFim; i++) { seletorAnoInicio.innerHTML += `<option value="${i}">${i}</option>`; seletorAnoFim.innerHTML += `<option value="${i}">${i}</option>`; } if (acao) { const [inicioAno, inicioMes] = acao.dataInicio.split('-'); const [fimAno, fimMes] = acao.dataFim.split('-'); modal.querySelector('#mesInicio').value = inicioMes; seletorAnoInicio.value = inicioAno; modal.querySelector('#mesFim').value = fimMes; seletorAnoFim.value = fimAno; } else { const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0'); modal.querySelector('#mesInicio').value = mesAtual; seletorAnoInicio.value = anoAtual; modal.querySelector('#mesFim').value = mesAtual; seletorAnoFim.value = anoAtual; } }
    salvarAcao() { const data = { titulo: document.getElementById('tituloAcao').value.trim(), descricao: document.getElementById('descricaoAcao').value.trim(), dataInicio: `${document.getElementById('anoInicio').value}-${document.getElementById('mesInicio').value}`, dataFim: `${document.getElementById('anoFim').value}-${document.getElementById('mesFim').value}`, categoria: document.getElementById('categoriaAcao').value, }; if (!data.titulo) return alert("O campo Título é obrigatório."); if (new Date(data.dataFim + '-01') < new Date(data.dataInicio + '-01')) return alert("A data de fim não pode ser anterior à data de início."); if (this.acaoEmEdicaoId) { const index = this.acoes.findIndex(a => a.id === this.acaoEmEdicaoId); if (index !== -1) this.acoes[index] = { ...this.acoes[index], ...data }; } else { this.acoes.push({ id: this.proximoId++, ...data }); }
        this.renderizarTimeline();
        this.renderizarObjetivoEProgresso();
        this.fecharModal('modalAcao');
        this.autosave();
    }

    abrirModalAdicaoItem(tipo) { this.itemEmEdicao = { tipo, index: null }; const titulos = { pontosFortes: 'Adicionar Item', metricas: 'Adicionar Métrica' }; const modal = document.getElementById('modalItem'); modal.querySelector('#modalItemHeader').textContent = titulos[tipo] || 'Adicionar Item'; modal.querySelector('#tituloItem').value = ''; modal.querySelector('#descricaoItem').value = ''; modal.querySelector('#saveItemBtn').textContent = 'Adicionar'; const tipoPontoWrapper = modal.querySelector('#tipoPontoWrapper'); if (tipo === 'pontosFortes') { tipoPontoWrapper.style.display = 'block'; modal.querySelector('#tipoPontoForte').checked = true; } else { tipoPontoWrapper.style.display = 'none'; } this.abrirModal('modalItem'); }
    abrirModalEdicaoItem(tipo, index) { this.itemEmEdicao = { tipo, index }; const titulos = { pontosFortes: 'Editar Ponto Forte', pontosDeMelhoria: 'Editar Ponto de Melhoria', metricas: 'Editar Métrica' }; const array = this[tipo]; const item = array[index]; const modal = document.getElementById('modalItem'); modal.querySelector('#tipoPontoWrapper').style.display = 'none'; modal.querySelector('#modalItemHeader').textContent = titulos[tipo]; modal.querySelector('#tituloItem').value = item.titulo; modal.querySelector('#descricaoItem').value = item.descricao; modal.querySelector('#saveItemBtn').textContent = 'Salvar Alterações'; this.abrirModal('modalItem'); }
    salvarItem() { if (!this.itemEmEdicao) return; let { tipo, index } = this.itemEmEdicao; const data = { titulo: document.getElementById('tituloItem').value.trim(), descricao: document.getElementById('descricaoItem').value.trim() }; if (!data.titulo) return alert("O campo Título é obrigatório."); if (index === null) { if (this.itemEmEdicao.tipo === 'pontosFortes') { const tipoSelecionado = document.querySelector('input[name="tipoPonto"]:checked')?.value; tipo = tipoSelecionado; } } if (index !== null) { this[tipo][index] = data; } else { this[tipo].push(data); } this.renderizarComponentesEstaticos(); this.fecharModal('modalItem'); this.itemEmEdicao = null; this.autosave(); }

    abrirModalExclusaoItem(tipo, idOuIndex, titulo) { this.itemParaExcluir = { tipo, id: idOuIndex }; document.getElementById('nomeItemExcluir').textContent = titulo; this.abrirModal('modalConfirmarExclusaoItem'); }
    confirmarExclusaoItem() { if (!this.itemParaExcluir) return; const { tipo, id } = this.itemParaExcluir; if (tipo === 'acao') this.acoes = this.acoes.filter(a => a.id !== id); else { this[tipo].splice(id, 1); } this.itemParaExcluir = null; this.renderizarTudo(); this.fecharModal('modalConfirmarExclusaoItem'); this.autosave(); }

    criarModaisDinamicos() { const mesesOptions = Array.from({ length: 12 }, (_, i) => `<option value="${String(i + 1).padStart(2, '0')}">${new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>`).join(''); const container = document.getElementById('modal-container'); container.innerHTML = `<div id="modalAcao" class="modal"><div class="modal-content"><h3 class="modal-header" id="modalAcaoHeader">Adicionar Ação</h3><div class="form-group"><label for="tituloAcao">Título:</label><input type="text" id="tituloAcao"></div><div class="form-group"><label for="descricaoAcao">Descrição (Opcional):</label><textarea id="descricaoAcao"></textarea></div><div class="form-group-row"><div class="form-group"><label>Início:</label><div class="form-group-row"><select id="mesInicio">${mesesOptions}</select><select id="anoInicio"></select></div></div><div class="form-group"><label>Fim:</label><div class="form-group-row"><select id="mesFim">${mesesOptions}</select><select id="anoFim"></select></div></div></div><div class="form-group"><label for="categoriaAcao">Categoria:</label><select id="categoriaAcao">${Object.keys(this.config.cores).map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}</select></div><div class="modal-buttons"><button class="btn btn-cancel">Cancelar</button><button class="btn" id="saveAcaoBtn">Adicionar</button></div></div></div><div id="modalItem" class="modal"><div class="modal-content"><h3 class="modal-header" id="modalItemHeader">Editar Item</h3><div class="form-group" id="tipoPontoWrapper" style="display: none;"><label>Tipo:</label><div class="radio-group"><input type="radio" id="tipoPontoForte" name="tipoPonto" value="pontosFortes" checked><label for="tipoPontoForte">Ponto Forte</label><input type="radio" id="tipoPontoMelhoria" name="tipoPonto" value="pontosDeMelhoria"><label for="tipoPontoMelhoria">Ponto de Melhoria</label></div></div><div class="form-group"><label for="tituloItem">Título:</label><input type="text" id="tituloItem"></div><div class="form-group"><label for="descricaoItem">Descrição:</label><textarea id="descricaoItem"></textarea></div><div class="modal-buttons"><button class="btn btn-cancel">Cancelar</button><button class="btn" id="saveItemBtn">Salvar</button></div></div></div><div id="modalConfirmarExclusaoItem" class="modal"><div class="modal-content"><h3 class="modal-header">Confirmar Exclusão</h3><p>Tem certeza que deseja excluir o item: "<strong><span id="nomeItemExcluir"></span></strong>"?</p><div class="modal-buttons"><button class="btn btn-cancel">Cancelar</button><button class="btn btn-delete" id="confirmExclusaoItem">Confirmar</button></div></div></div>`; }

    renderizarPontosFortes() { const container = document.getElementById('pontosFortesContainer'); if (!container) return; this.adicionarBotaoContextual('#secaoPontosFortes', () => this.abrirModalAdicaoItem('pontosFortes')); container.innerHTML = this.pontosFortes.map((item, index) => `<div class="ponto-forte card-editavel" data-index="${index}"><h4>${item.titulo}</h4><p>${item.descricao}</p><button class="btn-delete" data-index="${index}">×</button></div>`).join(''); container.querySelectorAll('.btn-delete').forEach((btn, index) => btn.addEventListener('click', (e) => { e.stopPropagation(); this.abrirModalExclusaoItem('pontosFortes', index, this.pontosFortes[index].titulo); })); container.querySelectorAll('.card-editavel').forEach((card, index) => card.addEventListener('click', () => this.abrirModalEdicaoItem('pontosFortes', index))); }
    renderizarPontosDeMelhoria() { const container = document.getElementById('pontosMelhoriaContainer'); const secao = document.getElementById('secaoPontosMelhoria'); const grid = document.querySelector('.secao-grid'); if (!container || !secao || !grid) return; if (this.pontosDeMelhoria.length === 0) { secao.style.display = 'none'; grid.classList.add('full-width'); } else { secao.style.display = 'block'; grid.classList.remove('full-width'); container.innerHTML = this.pontosDeMelhoria.map((item, index) => `<div class="ponto-melhoria card-editavel" data-index="${index}"><h4>${item.titulo}</h4><p>${item.descricao}</p><button class="btn-delete" data-index="${index}">×</button></div>`).join(''); container.querySelectorAll('.btn-delete').forEach((btn, index) => btn.addEventListener('click', (e) => { e.stopPropagation(); this.abrirModalExclusaoItem('pontosDeMelhoria', index, this.pontosDeMelhoria[index].titulo); })); container.querySelectorAll('.card-editavel').forEach((card, index) => card.addEventListener('click', () => this.abrirModalEdicaoItem('pontosDeMelhoria', index))); } }
    renderizarMetricas() { const container = document.getElementById('metricasContainer'); if (!container) return; this.adicionarBotaoContextual('#secaoMetricas', () => this.abrirModalAdicaoItem('metricas')); container.innerHTML = this.metricas.map((item, index) => `<div class="metrica-item card-editavel" data-index="${index}"><h5>${item.titulo}</h5><p style="white-space: pre-wrap;">${item.descricao}</p><button class="btn-delete" data-index="${index}">×</button></div>`).join(''); container.querySelectorAll('.btn-delete').forEach((btn, index) => btn.addEventListener('click', (e) => { e.stopPropagation(); this.abrirModalExclusaoItem('metricas', index, this.metricas[index].titulo); })); container.querySelectorAll('.card-editavel').forEach((card, index) => card.addEventListener('click', () => this.abrirModalEdicaoItem('metricas', index))); }

    autosave() {
        if (!this.autosaveEnabled) return;
        const dados = { config: this.config, acoes: this.acoes, pontosFortes: this.pontosFortes, pontosDeMelhoria: this.pontosDeMelhoria, metricas: this.metricas, proximoId: this.proximoId, autosaveEnabled: this.autosaveEnabled };
        localStorage.setItem('pdiDataGantt', JSON.stringify(dados));
    }
    exportarPDI() { const dados = { config: this.config, acoes: this.acoes, pontosFortes: this.pontosFortes, pontosDeMelhoria: this.pontosDeMelhoria, metricas: this.metricas, proximoId: this.proximoId, autosaveEnabled: this.autosaveEnabled }; const jsonString = JSON.stringify(dados, null, 2); const blob = new Blob([jsonString], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'meu-pdi.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
    carregarArquivo(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = e => { try { const dados = JSON.parse(e.target.result); this.aplicarDadosCarregados(dados); alert('PDI carregado com sucesso!'); } catch (error) { console.error("Erro ao carregar o arquivo JSON:", error); alert('Erro: O arquivo selecionado não é um JSON válido.'); } }; reader.readAsText(file); event.target.value = null; }
    aplicarDadosCarregados(dados) { if (!dados.pontosDeMelhoria) dados.pontosDeMelhoria = []; Object.assign(this, dados); if (!this.config) { const temp = {}; this.dadosIniciais.apply(temp); this.config = temp.config; } if (typeof this.autosaveEnabled !== 'boolean') { this.autosaveEnabled = true; } this.renderizarTudo(); this.autosave(); }
    carregarPDI(silencioso = false) { const dadosSalvos = localStorage.getItem('pdiDataGantt'); if (dadosSalvos) { this.aplicarDadosCarregados(JSON.parse(dadosSalvos)); if (!silencioso) alert('PDI carregado do backup local.'); } else { this.dadosIniciais(); } }
}

function CustomSelect(wrapper) { const selectEl = wrapper.querySelector('select'); if (!selectEl) return; const selectedDiv = document.createElement('div'); selectedDiv.className = 'select-selected'; selectedDiv.innerHTML = selectEl.options[selectEl.selectedIndex].innerHTML; wrapper.appendChild(selectedDiv); const optionsDiv = document.createElement('div'); optionsDiv.className = 'select-items select-hide'; Array.from(selectEl.options).forEach((option, index) => { const optionDiv = document.createElement('div'); optionDiv.innerHTML = option.innerHTML; if (index === selectEl.selectedIndex) optionDiv.className = "same-as-selected"; optionDiv.addEventListener('click', function () { selectEl.selectedIndex = index; selectedDiv.innerHTML = this.innerHTML; optionsDiv.querySelectorAll('.same-as-selected').forEach(o => o.removeAttribute('class')); this.className = 'same-as-selected'; selectedDiv.click(); selectEl.dispatchEvent(new Event('change')); }); optionsDiv.appendChild(optionDiv); }); wrapper.appendChild(optionsDiv); selectedDiv.addEventListener('click', function (e) { e.stopPropagation(); closeAllSelects(this); optionsDiv.classList.toggle('select-hide'); this.classList.toggle('select-arrow-active'); }); }
function closeAllSelects(elmnt) { document.querySelectorAll('.select-items').forEach(item => { if (elmnt && elmnt.nextElementSibling !== item && elmnt !== item.previousElementSibling) { item.classList.add('select-hide'); if (item.previousElementSibling) item.previousElementSibling.classList.remove('select-arrow-active'); } }); }

document.addEventListener('click', e => closeAllSelects(e.target));
document.addEventListener('DOMContentLoaded', () => {
    window.pdiApp = new PDI();
    window.pdiApp.init();
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => new CustomSelect(wrapper));
});