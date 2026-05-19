// =====================================================
// M.M System - Fase 4: Onboarding, Empty States,
// Skeletons, Feedback Visual, Erros, Confirmacoes,
// Tooltips e Progress Indicators
// =====================================================

// ==================== CONFIGURACAO ====================
const FASE4 = {
    onboardingKey: 'mm_onboarding_completed',
    toastDuration: 3000,
    skeletonDelay: 800
};

// ==================== ONBOARDING TOUR ====================
let onboardingAtivo = false;
let onboardingPassoAtual = 0;

const onboardingPassos = [
    {
        target: '.tabs',
        posicao: 'bottom',
        titulo: 'Navegue entre as abas',
        descricao: 'Use as abas para alternar entre Estoque, Vendas e Relatorio. Tudo organizado em um so lugar.',
        offset: { x: 0, y: 10 }
    },
    {
        target: '#produtoForm',
        posicao: 'right',
        titulo: 'Cadastre seus produtos',
        descricao: 'Preencha os dados da compra e o sistema calcula automaticamente o preco de venda com a margem de lucro.',
        offset: { x: 10, y: 0 }
    },
    {
        target: '.list-section',
        posicao: 'top',
        titulo: 'Acompanhe seu estoque',
        descricao: 'Veja todos os produtos cadastrados, filtre por disponiveis ou vendidos, edite ou exclua quando precisar.',
        offset: { x: 0, y: -10 }
    },
    {
        target: '.logout-btn, .logout-mobile-btn',
        posicao: 'left',
        titulo: 'Sair com seguranca',
        descricao: 'Clique aqui para sair do sistema. Seus dados ficam salvos automaticamente na nuvem.',
        offset: { x: -10, y: 0 }
    }
];

function iniciarOnboarding() {
    if (localStorage.getItem(FASE4.onboardingKey) === 'true') return;
    if (onboardingAtivo) return;

    const isMobile = window.innerWidth <= 768;
    const versaoAtiva = isMobile ? '#mobile-version' : '#desktop-version';
    const versaoEl = document.querySelector(versaoAtiva);
    if (!versaoEl || versaoEl.classList.contains('app-locked')) return;

    onboardingAtivo = true;
    onboardingPassoAtual = 0;

    criarOverlayOnboarding();
    mostrarPassoOnboarding(0);
}

function criarOverlayOnboarding() {
    let overlay = document.getElementById('onboarding-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay';
        document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
}

function mostrarPassoOnboarding(passo) {
    const passoData = onboardingPassos[passo];
    if (!passoData) {
        finalizarOnboarding();
        return;
    }

    // Remove tooltip anterior
    const tooltipAnterior = document.getElementById('onboarding-tooltip');
    if (tooltipAnterior) tooltipAnterior.remove();

    // Atualiza spotlight
    const overlay = document.getElementById('onboarding-overlay');
    let spotlight = document.getElementById('onboarding-spotlight');
    if (!spotlight) {
        spotlight = document.createElement('div');
        spotlight.id = 'onboarding-spotlight';
        spotlight.className = 'onboarding-spotlight';
        overlay.appendChild(spotlight);
    }

    const target = document.querySelector(passoData.target);
    if (!target) {
        // Se nao encontrar o target, pula para o proximo
        if (passo + 1 < onboardingPassos.length) {
            mostrarPassoOnboarding(passo + 1);
        } else {
            finalizarOnboarding();
        }
        return;
    }

    const rect = target.getBoundingClientRect();
    const padding = 8;

    spotlight.style.left = (rect.left - padding) + 'px';
    spotlight.style.top = (rect.top - padding) + 'px';
    spotlight.style.width = (rect.width + padding * 2) + 'px';
    spotlight.style.height = (rect.height + padding * 2) + 'px';

    // Cria tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'onboarding-tooltip';
    tooltip.className = 'onboarding-tooltip ' + passoData.posicao;

    // Progresso
    let progressHTML = '<div class="onboarding-progress">';
    for (let i = 0; i < onboardingPassos.length; i++) {
        progressHTML += `<div class="onboarding-progress-dot ${i === passo ? 'active' : ''}"></div>`;
    }
    progressHTML += '</div>';

    tooltip.innerHTML = `
        ${progressHTML}
        <div class="onboarding-step-number">${passo + 1}</div>
        <div class="onboarding-title">${passoData.titulo}</div>
        <div class="onboarding-desc">${passoData.descricao}</div>
        <div class="onboarding-actions">
            <button class="onboarding-btn onboarding-btn-skip" onclick="finalizarOnboarding()">Pular</button>
            <button class="onboarding-btn onboarding-btn-next" onclick="proximoPassoOnboarding()">
                ${passo === onboardingPassos.length - 1 ? 'Concluir' : 'Proximo'}
            </button>
        </div>
    `;

    document.body.appendChild(tooltip);

    // Posiciona tooltip
    requestAnimationFrame(() => {
        const tooltipRect = tooltip.getBoundingClientRect();
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top + rect.height + 20;

        if (passoData.posicao === 'top') {
            top = rect.top - tooltipRect.height - 20;
        } else if (passoData.posicao === 'left') {
            left = rect.left - tooltipRect.width - 20;
            top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        } else if (passoData.posicao === 'right') {
            left = rect.left + rect.width + 20;
            top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        }

        // Ajusta para nao sair da tela
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipRect.width - 16));
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipRect.height - 16));

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.classList.add('active');
    });
}

function proximoPassoOnboarding() {
    onboardingPassoAtual++;
    if (onboardingPassoAtual >= onboardingPassos.length) {
        finalizarOnboarding();
    } else {
        mostrarPassoOnboarding(onboardingPassoAtual);
    }
}

function finalizarOnboarding() {
    onboardingAtivo = false;
    localStorage.setItem(FASE4.onboardingKey, 'true');

    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.classList.remove('active');

    const tooltip = document.getElementById('onboarding-tooltip');
    if (tooltip) tooltip.remove();

    const spotlight = document.getElementById('onboarding-spotlight');
    if (spotlight) spotlight.remove();

    setTimeout(() => {
        if (overlay) overlay.remove();
    }, 500);
}

function resetarOnboarding() {
    localStorage.removeItem(FASE4.onboardingKey);
    mostrarToastPremium('Tour reiniciado! Recarregue a pagina para ver.', 'info');
}

// ==================== EMPTY STATES PREMIUM ====================

function getEmptyStateHTML(tipo, acaoTexto, acaoOnclick) {
    const configs = {
        estoque: {
            icone: 'fa-box-open',
            titulo: 'Nenhum produto cadastrado',
            descricao: 'Cadastre seu primeiro produto para comecar a gerenciar seu estoque.'
        },
        vendas: {
            icone: 'fa-shopping-bag',
            titulo: 'Nenhuma venda registrada',
            descricao: 'Suas vendas aparecerao aqui assim que voce registrar a primeira.'
        },
        relatorio: {
            icone: 'fa-chart-pie',
            titulo: 'Sem dados para relatorio',
            descricao: 'Cadastre produtos e registre vendas para visualizar o resumo financeiro.'
        },
        busca: {
            icone: 'fa-search',
            titulo: 'Nenhum resultado encontrado',
            descricao: 'Tente ajustar os termos da busca ou os filtros aplicados.'
        }
    };

    const config = configs[tipo] || configs.estoque;

    return `
        <div class="empty-state-premium">
            <div class="empty-icon"><i class="fas ${config.icone}"></i></div>
            <div class="empty-title">${config.titulo}</div>
            <div class="empty-desc">${config.descricao}</div>
            ${acaoTexto ? `<button class="empty-action" onclick="${acaoOnclick}">${acaoTexto}</button>` : ''}
        </div>
    `;
}

function getEmptyStateTableHTML(tipo) {
    const configs = {
        estoque: {
            icone: 'fa-box-open',
            titulo: 'Nenhum produto cadastrado',
            descricao: 'Cadastre produtos para ve-los aqui'
        },
        vendas: {
            icone: 'fa-shopping-bag',
            titulo: 'Nenhuma venda registrada',
            descricao: 'Registre uma venda para ve-la aqui'
        }
    };

    const config = configs[tipo] || configs.estoque;
    const colunas = tipo === 'estoque' ? 8 : 7;

    return `
        <tr class="empty-state-table">
            <td colspan="${colunas}">
                <div class="empty-icon-wrap"><i class="fas ${config.icone}"></i></div>
                <div class="empty-title">${config.titulo}</div>
                <div class="empty-desc">${config.descricao}</div>
            </td>
        </tr>
    `;
}

// ==================== SKELETON SCREENS ====================

function mostrarSkeletonEstoqueDesktop() {
    const tbody = document.getElementById('listaEstoque');
    if (!tbody) return;

    let html = '';
    for (let i = 0; i < 5; i++) {
        html += `<tr class="skeleton-table-row"><td colspan="8"></td></tr>`;
    }
    tbody.innerHTML = html;
}

function mostrarSkeletonVendasDesktop() {
    const tbody = document.getElementById('listaVendas');
    if (!tbody) return;

    let html = '';
    for (let i = 0; i < 4; i++) {
        html += `<tr class="skeleton-table-row"><td colspan="7"></td></tr>`;
    }
    tbody.innerHTML = html;
}

function mostrarSkeletonEstoqueMobile() {
    const lista = document.getElementById('listaEstoqueMobile');
    if (!lista) return;

    let html = '<div class="skeleton-container">';
    for (let i = 0; i < 4; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line"></div>
                </div>
            </div>
        `;
    }
    html += '</div>';
    lista.innerHTML = html;
}

function mostrarSkeletonVendasMobile() {
    const lista = document.getElementById('listaVendasMobile');
    if (!lista) return;

    let html = '<div class="skeleton-container">';
    for (let i = 0; i < 3; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `;
    }
    html += '</div>';
    lista.innerHTML = html;
}

function mostrarSkeletonDashboard() {
    const dashCards = document.querySelector('.cards-grid');
    if (!dashCards) return;

    dashCards.innerHTML = `
        <div class="skeleton-dash-card"></div>
        <div class="skeleton-dash-card"></div>
        <div class="skeleton-dash-card"></div>
        <div class="skeleton-dash-card"></div>
    `;
}

function mostrarSkeletonRelatorio() {
    const reportCards = document.querySelector('.report-cards');
    if (!reportCards) return;

    reportCards.innerHTML = `
        <div class="skeleton-card" style="height:80px;">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
            </div>
        </div>
        <div class="skeleton-card" style="height:80px;">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
            </div>
        </div>
        <div class="skeleton-card" style="height:80px;">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
            </div>
        </div>
        <div class="skeleton-card" style="height:80px;">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
            </div>
        </div>
    `;
}

// ==================== TOAST PREMIUM ====================

function mostrarToastPremium(mensagem, tipo = 'success', duracao = FASE4.toastDuration) {
    let container = document.getElementById('toast-premium-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-premium-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-premium ${tipo}`;

    const icones = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icones[tipo] || icones.success}"></i></div>
        <div class="toast-message">${mensagem}</div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 400);
    }, duracao);
}

// ==================== ESTADOS DE ERRO ====================

function mostrarErroInput(inputId, mensagem) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.add('input-error');

    // Remove mensagem anterior
    const grupo = input.closest('.form-group');
    if (grupo) {
        const msgAnterior = grupo.querySelector('.input-error-message');
        if (msgAnterior) msgAnterior.remove();

        const msg = document.createElement('div');
        msg.className = 'input-error-message';
        msg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensagem}`;
        grupo.appendChild(msg);
    }

    input.addEventListener('input', function limparErro() {
        input.classList.remove('input-error');
        if (grupo) {
            const msg = grupo.querySelector('.input-error-message');
            if (msg) msg.remove();
        }
        input.removeEventListener('input', limparErro);
    }, { once: true });
}

function mostrarErroCarregamento(containerId, titulo, descricao, acaoTexto, acaoCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="error-title">${titulo}</div>
            <div class="error-desc">${descricao}</div>
            ${acaoTexto ? `<button class="error-action" onclick="${acaoCallback}">${acaoTexto}</button>` : ''}
        </div>
    `;
}

// ==================== CONFIRMACOES VISUAIS ====================

let confirmCallback = null;

function mostrarConfirmacao(titulo, descricao, tipo = 'danger', textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar') {
    return new Promise((resolve) => {
        let modal = document.getElementById('confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'confirm-modal';
            modal.className = 'confirm-modal';
            document.body.appendChild(modal);
        }

        modal.className = `confirm-modal ${tipo}`;
        modal.innerHTML = `
            <div class="confirm-modal-content">
                <div class="confirm-icon"><i class="fas ${tipo === 'danger' ? 'fa-trash-alt' : tipo === 'warning' ? 'fa-sign-out-alt' : 'fa-info-circle'}"></i></div>
                <div class="confirm-title">${titulo}</div>
                <div class="confirm-desc">${descricao}</div>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-btn-cancel" onclick="fecharConfirmacao(false)">${textoCancelar}</button>
                    <button class="confirm-btn confirm-btn-confirm ${tipo}" onclick="fecharConfirmacao(true)">${textoConfirmar}</button>
                </div>
            </div>
        `;

        confirmCallback = resolve;

        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    });
}

function fecharConfirmacao(resultado) {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    if (confirmCallback) {
        confirmCallback(resultado);
        confirmCallback = null;
    }
}

// ==================== TOOLTIPS ====================

function inicializarTooltips() {
    // Adiciona tooltips aos botoes de acao da tabela desktop
    document.querySelectorAll('.btn-action').forEach(btn => {
        if (btn.classList.contains('btn-edit') && !btn.dataset.tooltip) {
            btn.classList.add('tooltip');
            btn.dataset.tooltip = 'Editar produto';
        }
        if (btn.classList.contains('btn-delete') && !btn.dataset.tooltip) {
            btn.classList.add('tooltip');
            btn.dataset.tooltip = 'Excluir produto';
        }
    });

    // Tooltips para botoes de filtro
    document.querySelectorAll('.btn-filter').forEach(btn => {
        if (!btn.dataset.tooltip) {
            btn.classList.add('tooltip');
            btn.dataset.tooltip = 'Filtrar lista';
        }
    });

    // Tooltips para abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (!btn.dataset.tooltip) {
            btn.classList.add('tooltip');
            const texto = btn.textContent.trim();
            btn.dataset.tooltip = `Ver ${texto}`;
        }
    });

    // Tooltips para logout
    document.querySelectorAll('.logout-btn, .logout-mobile-btn').forEach(btn => {
        if (!btn.dataset.tooltip) {
            btn.classList.add('tooltip');
            btn.dataset.tooltip = 'Sair do sistema';
        }
    });

    // Tooltips para bottom nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (!btn.dataset.tooltip && btn.querySelector('span')) {
            btn.classList.add('tooltip');
            btn.dataset.tooltip = btn.querySelector('span').textContent;
        }
    });
}

// ==================== INDICADORES DE PROGRESSO ====================

function criarProgressRingSVG() {
    if (document.getElementById('progress-ring-svg')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.id = 'progress-ring-svg';
    svg.innerHTML = `
        <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#BF3604"/>
                <stop offset="100%" style="stop-color:#F29B30"/>
            </linearGradient>
        </defs>
    `;
    document.body.appendChild(svg);
}

function atualizarProgressoROI(valor) {
    const pf = document.getElementById('progressROI');
    const tr = document.getElementById('textROI');
    if (pf) {
        pf.style.width = '0%';
        pf.classList.add('animated');
        setTimeout(() => pf.style.width = valor + '%', 100);
    }
    if (tr) tr.textContent = valor.toFixed(1) + '% do investimento retornado';
}

// ==================== LOADING OVERLAY ====================

function mostrarLoading(texto = 'Carregando...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">${texto}</div>
    `;
    overlay.classList.add('active');
}

function esconderLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

// ==================== FEEDBACK EM ACOES ====================

// Sobrescreve funcoes originais para adicionar feedback visual

const originalAdicionarProduto = window.adicionarProduto;
window.adicionarProduto = function(e) {
    e.preventDefault();

    const nome = document.getElementById('nome')?.value.trim();
    const qtd = parseInt(document.getElementById('quantidade')?.value);
    const custo = parseFloat(document.getElementById('custo')?.value);

    if (!nome) {
        mostrarErroInput('nome', 'Digite o nome do produto');
        mostrarToastPremium('Preencha o nome do produto', 'error');
        return;
    }
    if (!qtd || qtd <= 0) {
        mostrarErroInput('quantidade', 'Quantidade deve ser maior que zero');
        mostrarToastPremium('Quantidade invalida', 'error');
        return;
    }
    if (!custo || custo <= 0) {
        mostrarErroInput('custo', 'Custo deve ser maior que zero');
        mostrarToastPremium('Custo invalido', 'error');
        return;
    }

    // Executa funcao original
    const custoVal = parseFloat(document.getElementById('custo').value) || 0;
    const porcentagem = parseFloat(document.getElementById('porcentagem').value) || 0;
    const quantidade = parseInt(document.getElementById('quantidade').value) || 0;
    const vendaEl = document.getElementById('venda');
    const venda = parseFloat(vendaEl.dataset.valor || vendaEl.value) || 0;

    const novoProduto = {
        id: Date.now(),
        codigo: gerarCodigo(),
        nome: document.getElementById('nome').value,
        quantidade: quantidade,
        quantidadeVendida: 0,
        custo: custoVal,
        porcentagem: porcentagem,
        venda: venda,
        data: new Date().toLocaleDateString()
    };

    produtos.push(novoProduto);
    salvarDados();
    limparFormulario();
    carregarEstoqueDesktop();
    mostrarToastPremium('Produto cadastrado com sucesso!', 'success');

    setTimeout(() => {
        const tbody = document.getElementById('listaEstoque');
        if (tbody) {
            const primeiraLinha = tbody.querySelector('tr');
            if (primeiraLinha) {
                primeiraLinha.classList.add('flash-green');
                setTimeout(() => primeiraLinha.classList.remove('flash-green'), 800);
            }
        }
    }, 100);
};

const originalSalvarEdicaoProduto = window.salvarEdicaoProduto;
window.salvarEdicaoProduto = function(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editProdutoId').value);
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    const quantidade = parseInt(document.getElementById('editQuantidade').value) || 0;
    const quantidadeVendida = parseInt(document.getElementById('editQuantidadeVendida').value) || 0;

    if (quantidade <= 0) {
        mostrarToastPremium('Quantidade total deve ser maior que zero', 'error');
        return;
    }
    if (quantidadeVendida < 0 || quantidadeVendida > quantidade) {
        mostrarToastPremium('Verifique as quantidades informadas', 'error');
        return;
    }

    const custo = parseFloat(String(document.getElementById('editCusto').value).replace(',', '.')) || 0;
    const porcentagem = parseFloat(String(document.getElementById('editPorcentagem').value).replace(',', '.')) || 0;
    const venda = parseFloat(document.getElementById('editVenda').dataset.valor) || 0;

    produto.nome = document.getElementById('editNome').value.trim();
    produto.quantidade = quantidade;
    produto.quantidadeVendida = quantidadeVendida;
    produto.custo = custo;
    produto.porcentagem = porcentagem;
    produto.margem = porcentagem;
    produto.venda = venda;

    salvarDados();
    fecharModalAnimado('modal-editar-produto');
    mostrarToastPremium('Produto atualizado com sucesso!', 'success');

    setTimeout(() => {
        const tbody = document.getElementById('listaEstoque');
        if (tbody) {
            const linha = tbody.querySelector(`tr[data-id="${id}"]`);
            if (linha) {
                linha.classList.add('flash-orange');
                setTimeout(() => linha.classList.remove('flash-orange'), 800);
            }
        }
    }, 350);

    atualizarTodasTelas();
};

const originalExcluirProduto = window.excluirProduto;
window.excluirProduto = async function(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    const confirmado = await mostrarConfirmacao(
        'Excluir produto?',
        `Tem certeza que deseja excluir "${produto.nome}"? Esta acao nao pode ser desfeita.`,
        'danger',
        'Excluir',
        'Cancelar'
    );

    if (!confirmado) return;

    const tbody = document.getElementById('listaEstoque');
    if (tbody) {
        const linha = tbody.querySelector(`tr[data-id="${id}"]`);
        if (linha) {
            linha.classList.add('deleting-row');
            setTimeout(() => {
                produtos = produtos.filter(p => p.id !== id);
                salvarDados();
                carregarEstoqueDesktop();
                mostrarToastPremium('Produto excluido', 'success');
            }, 400);
            return;
        }
    }

    produtos = produtos.filter(p => p.id !== id);
    salvarDados();
    carregarEstoqueDesktop();
    mostrarToastPremium('Produto excluido', 'success');
};

const originalRegistrarVendaDesktop = window.registrarVendaDesktop;
window.registrarVendaDesktop = function(e) {
    e.preventDefault();
    const produtoId = parseInt(document.getElementById('produtoVenda').value);
    const qtd = parseInt(document.getElementById('quantidadeVenda').value);

    if (!produtoId || !qtd) {
        mostrarToastPremium('Preencha todos os campos da venda', 'error');
        return;
    }

    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) {
        mostrarToastPremium('Produto nao encontrado', 'error');
        return;
    }

    const disp = produto.quantidade - (produto.quantidadeVendida || 0);
    if (qtd > disp) {
        mostrarToastPremium(`Apenas ${disp} unidades disponiveis`, 'warning');
        return;
    }

    const qtdAnterior = produto.quantidadeVendida || 0;
    produto.quantidadeVendida = qtdAnterior + qtd;
    vendas.push({
        id: Date.now(), data: new Date().toLocaleDateString(),
        produtoId: produto.id, codigo: produto.codigo, nome: produto.nome,
        quantidade: qtd, vendaUnit: produto.venda,
        total: produto.venda * qtd, lucro: (produto.venda - produto.custo) * qtd
    });

    salvarDados();
    document.getElementById('vendaForm').reset();
    ['precoVenda','totalVenda','lucroVenda','lucroTotalVenda'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    carregarVendasDesktop();
    carregarSelectProdutosDesktop();
    carregarEstoqueDesktop();
    mostrarToastPremium('Venda registrada com sucesso!', 'success');

    setTimeout(() => {
        const tbody = document.getElementById('listaEstoque');
        if (tbody) {
            const linha = tbody.querySelector(`tr[data-id="${produtoId}"]`);
            if (linha) {
                const tdVendido = linha.querySelector('td:nth-child(4)');
                if (tdVendido) {
                    tdVendido.classList.add('count-update');
                    setTimeout(() => tdVendido.classList.remove('count-update'), 300);
                }
            }
        }
    }, 100);
};

const originalLogoutSistema = window.logoutSistema;
window.logoutSistema = async function() {
    const confirmado = await mostrarConfirmacao(
        'Sair do sistema?',
        'Tem certeza que deseja sair? Seus dados estao seguros na nuvem.',
        'warning',
        'Sair',
        'Ficar'
    );

    if (!confirmado) return;

    localStorage.removeItem('mm_login_autenticado');
    sessionStorage.removeItem('mm_login_autenticado');
    bloquearSistema();
    mostrarToastPremium('Voce saiu do sistema', 'info');
};

const originalCadastrarProdutoMobile = window.cadastrarProdutoMobile;
window.cadastrarProdutoMobile = function(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeProduto').value.trim();
    const qtd = parseInt(document.getElementById('qtdProduto').value) || 0;
    const custo = parseFloat(document.getElementById('custoProduto').value) || 0;
    const margem = parseFloat(document.getElementById('margemProduto').value) || 0;
    const vendaEl = document.getElementById('precoVendaProduto');
    const venda = parseFloat(vendaEl.dataset.valor || vendaEl.value) || 0;

    if (!nome) {
        mostrarToastPremium('Digite o nome do produto', 'error');
        return;
    }
    if (qtd <= 0) {
        mostrarToastPremium('Quantidade invalida', 'error');
        return;
    }
    if (custo <= 0) {
        mostrarToastPremium('Custo invalido', 'error');
        return;
    }

    produtos.push({
        id: Date.now(), codigo: gerarCodigo(), nome, quantidade: qtd,
        quantidadeVendida: 0, custo, margem,
        venda: venda, data: new Date().toLocaleDateString()
    });

    salvarDados();
    fecharModal('modal-cadastrar');
    mostrarToastPremium('Produto cadastrado com sucesso!', 'success');
    atualizarDashboard();
    carregarEstoqueMobile();
};

const originalRegistrarVendaMobile = window.registrarVendaMobile;
window.registrarVendaMobile = function(e) {
    e.preventDefault();
    const pid = parseInt(document.getElementById('selectProduto').value);
    const qtd = parseInt(document.getElementById('qtdVenda').value);

    if (!pid || !qtd) {
        mostrarToastPremium('Preencha todos os campos', 'error');
        return;
    }

    const p = produtos.find(x => x.id === pid);
    if (!p) {
        mostrarToastPremium('Produto nao encontrado', 'error');
        return;
    }

    const disp = p.quantidade - (p.quantidadeVendida || 0);
    if (qtd > disp) {
        mostrarToastPremium(`Apenas ${disp} disponiveis`, 'warning');
        return;
    }

    p.quantidadeVendida = (p.quantidadeVendida || 0) + qtd;
    vendas.push({
        id: Date.now(), data: new Date().toLocaleDateString(),
        produtoId: p.id, codigo: p.codigo, nome: p.nome,
        quantidade: qtd, vendaUnit: p.venda,
        total: p.venda * qtd, lucro: (p.venda - p.custo) * qtd
    });

    salvarDados();
    fecharModal('modal-vender');
    mostrarToastPremium('Venda registrada com sucesso!', 'success');
    atualizarDashboard();
    carregarVendasMobile();
    carregarEstoqueMobile();
};

const originalVerDetalhesProduto = window.verDetalhesProduto;
window.verDetalhesProduto = async function(id) {
    const p = produtos.find(x => x.id === id);
    if (!p) return;
    const disp = p.quantidade - (p.quantidadeVendida || 0);

    const confirmado = await mostrarConfirmacao(
        'Excluir produto?',
        `${p.nome}\nCodigo: ${p.codigo}\nQtd: ${p.quantidade} | Vendido: ${p.quantidadeVendida || 0} | Disp: ${disp}\n\nTem certeza que deseja excluir?`,
        'danger',
        'Excluir',
        'Cancelar'
    );

    if (!confirmado) return;

    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (card) {
        card.classList.add('deleting-card');
        setTimeout(() => {
            produtos = produtos.filter(x => x.id !== id);
            salvarDados();
            mostrarToastPremium('Produto excluido', 'success');
            carregarEstoqueMobile();
            atualizarDashboard();
        }, 400);
        return;
    }

    produtos = produtos.filter(x => x.id !== id);
    salvarDados();
    mostrarToastPremium('Produto excluido', 'success');
    carregarEstoqueMobile();
    atualizarDashboard();
};

// ==================== ATUALIZAR TELAS COM EMPTY STATES ====================

const originalCarregarEstoqueDesktop = window.carregarEstoqueDesktop;
window.carregarEstoqueDesktop = function(filtro) {
    const tbody = document.getElementById('listaEstoque');
    if (!tbody) return;

    let filtrados = produtos;
    if (filtro === 'disponivel') filtrados = produtos.filter(p => p.quantidade > p.quantidadeVendida);
    else if (filtro === 'vendido') filtrados = produtos.filter(p => p.quantidadeVendida > 0);

    if (!filtrados.length) {
        tbody.innerHTML = getEmptyStateTableHTML('estoque');
        return;
    }

    tbody.innerHTML = filtrados.map((p, index) => {
        const disp = p.quantidade - (p.quantidadeVendida || 0);
        let status = 'Disponivel', cls = 'status-disponivel';
        if (disp === 0) { status = 'Vendido'; cls = 'status-vendido'; }
        else if (p.quantidadeVendida > 0) { status = 'Vendido'; cls = 'status-vendido'; }

        return `<tr class="stagger-row" data-id="${p.id}">
            <td><strong>${p.codigo}</strong></td>
            <td>${p.nome}</td>
            <td>${p.quantidade}</td>
            <td>${p.quantidadeVendida || 0}</td>
            <td>${formatarValor(p.custo)}</td>
            <td>${formatarValor(p.venda)}</td>
            <td><span class="status ${cls}">${status}</span></td>
            <td><div class="action-buttons">
                <button class="btn-action btn-edit tooltip" data-tooltip="Editar produto" onclick="abrirEdicaoProduto(${p.id})"><i class="fas fa-pen"></i></button>
                <button class="btn-action btn-delete tooltip" data-tooltip="Excluir produto" onclick="excluirProduto(${p.id})"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`;
    }).join('');
};

const originalCarregarVendasDesktop = window.carregarVendasDesktop;
window.carregarVendasDesktop = function() {
    const tbody = document.getElementById('listaVendas');
    if (!tbody) return;
    if (!vendas.length) {
        tbody.innerHTML = getEmptyStateTableHTML('vendas');
        return;
    }
    tbody.innerHTML = vendas.slice().reverse().map((v, index) => `<tr class="stagger-row">
        <td>${v.data}</td>
        <td><strong>${v.codigo}</strong></td>
        <td>${v.nome}</td>
        <td>${v.quantidade}</td>
        <td>${formatarValor(v.vendaUnit)}</td>
        <td>${formatarValor(v.total)}</td>
        <td><strong style="color:#27ae60;">${formatarValor(v.lucro)}</strong></td>
    </tr>`).join('');
};

const originalCarregarEstoqueMobile = window.carregarEstoqueMobile;
window.carregarEstoqueMobile = function() {
    const lista = document.getElementById('listaEstoqueMobile');
    if (!lista) return;

    let f = produtos;
    if (buscaAtual) f = f.filter(p => p.nome.toLowerCase().includes(buscaAtual.toLowerCase()) || p.codigo.toLowerCase().includes(buscaAtual.toLowerCase()));
    if (filtroAtual === 'disponivel') f = f.filter(p => p.quantidade > (p.quantidadeVendida || 0));
    else if (filtroAtual === 'vendido') f = f.filter(p => (p.quantidadeVendida || 0) > 0);

    if (!f.length) {
        lista.innerHTML = getEmptyStateHTML('estoque', 'Cadastrar Produto', "abrirModal('modal-cadastrar')");
        return;
    }

    lista.innerHTML = f.map((p, index) => {
        const disp = p.quantidade - (p.quantidadeVendida || 0);
        const pct = Math.round((disp / p.quantidade) * 100);
        let st = 'disponivel', txt = 'Disponivel';
        if (disp === 0) { st = 'vendido'; txt = 'Vendido'; }
        else if (p.quantidadeVendida > 0) { st = 'vendido'; txt = 'Vendido'; }

        return `<div class="product-card stagger-card" data-id="${p.id}" onclick="verDetalhesProduto(${p.id})">
            <div class="product-img"><i class="fas fa-tshirt"></i></div>
            <div class="product-info"><div class="product-name">${p.nome}</div><div class="product-meta"><span class="status-badge status-${st}">${txt}</span><span>${p.codigo}</span></div></div>
            <div class="product-price"><div class="price">${formatarValor(p.venda)}</div><div class="stock">${disp}/${p.quantidade} disp.</div></div>
        </div>`;
    }).join('');
};

const originalCarregarVendasMobile = window.carregarVendasMobile;
window.carregarVendasMobile = function() {
    const lista = document.getElementById('listaVendasMobile');
    if (!lista) return;

    let tv = 0, tl = 0;
    vendas.forEach(v => { tv += v.total; tl += v.lucro; });

    const elTotal = document.getElementById('vendasTotal');
    const elLucro = document.getElementById('vendasLucro');
    if (elTotal) elTotal.textContent = formatarValor(tv);
    if (elLucro) elLucro.textContent = formatarValor(tl);

    if (!vendas.length) {
        lista.innerHTML = getEmptyStateHTML('vendas', null, null);
        return;
    }

    lista.innerHTML = vendas.slice().reverse().map((v, index) => `<div class="sale-card stagger-card">
        <div class="product-img" style="width:40px;height:40px;font-size:1rem;"><i class="fas fa-shopping-bag"></i></div>
        <div class="sale-info"><div class="sale-product">${v.nome}</div><div class="sale-detail">${v.data} · ${v.quantidade} un · ${v.codigo}</div></div>
        <div class="sale-value"><div class="value">${formatarValor(v.total)}</div><div class="profit">+${formatarValor(v.lucro)}</div></div>
    </div>`).join('');
};

const originalAtualizarRelatorioMobile = window.atualizarRelatorioMobile;
window.atualizarRelatorioMobile = function() {
    let ti = 0, tv = 0, lr = 0, ve = 0;
    produtos.forEach(p => {
        const qv = p.quantidadeVendida || 0;
        const qe = p.quantidade - qv;
        ti += p.custo * p.quantidade;
        tv += p.venda * qv;
        lr += (p.venda - p.custo) * qv;
        ve += p.custo * qe;
    });

    const ids = ['relInvestido', 'relVendido', 'relLucro', 'relEstoque'];
    const vals = [ti, tv, lr, ve];
    ids.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = formatarValor(vals[i]); });

    const roi = ti > 0 ? Math.min((tv / ti) * 100, 100) : 0;
    atualizarProgressoROI(roi);
};

const originalAtualizarRelatorioDesktop = window.atualizarRelatorioDesktop;
window.atualizarRelatorioDesktop = function() {
    let ti = 0, tv = 0, lr = 0, ve = 0;
    produtos.forEach(p => {
        const qv = p.quantidadeVendida || 0;
        const qe = p.quantidade - qv;
        ti += p.custo * p.quantidade;
        tv += p.venda * qv;
        lr += (p.venda - p.custo) * qv;
        ve += p.custo * qe;
    });
    const els = ['totalInvestido', 'totalVendido', 'totalLucro', 'totalEstoque'];
    const vals = [ti, tv, lr, ve];
    els.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = formatarValor(vals[i]); });
};

// ==================== LOGIN FEEDBACK ====================

const originalAutenticarLogin = window.autenticarLogin;
window.autenticarLogin = function(e) {
    e.preventDefault();

    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const lembrar = document.getElementById('lembrarLogin').checked;
    const erro = document.getElementById('loginErro');

    if (!usuario) {
        mostrarErroInput('loginUsuario', 'Digite seu usuario');
        if (erro) erro.textContent = 'Digite seu usuario';
        return;
    }
    if (!senha) {
        mostrarErroInput('loginSenha', 'Digite sua senha');
        if (erro) erro.textContent = 'Digite sua senha';
        return;
    }

    if (usuario === LOGIN_USUARIO && senha === LOGIN_SENHA) {
        if (lembrar) {
            localStorage.setItem('mm_login_autenticado', 'true');
        } else {
            sessionStorage.setItem('mm_login_autenticado', 'true');
        }
        liberarSistema();
        mostrarToastPremium('Bem-vindo ao M.M System!', 'success');
        init();

        // Inicia onboarding apos login
        setTimeout(() => {
            iniciarOnboarding();
        }, 1000);
        return;
    }

    mostrarErroInput('loginUsuario', '');
    mostrarErroInput('loginSenha', '');
    if (erro) erro.textContent = 'Login ou senha invalidos';
    mostrarToastPremium('Login ou senha invalidos', 'error');
};

// ==================== INIT FASE 4 ====================

document.addEventListener('DOMContentLoaded', function() {
    criarProgressRingSVG();
    inicializarTooltips();

    // Verifica se deve iniciar onboarding
    setTimeout(() => {
        const autenticado = localStorage.getItem('mm_login_autenticado') === 'true' || sessionStorage.getItem('mm_login_autenticado') === 'true';
        if (autenticado) {
            iniciarOnboarding();
        }
    }, 1500);

    // Re-inicializa tooltips quando o DOM muda
    const observer = new MutationObserver(() => {
        inicializarTooltips();
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

console.log('Fase 4 carregada: Onboarding, Empty States, Skeletons, Feedback, Erros, Confirmacoes, Tooltips, Progresso');
