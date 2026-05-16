// ==================== UTILITARIOS ====================
const formatarValor = (valor) => {
    return 'R$ ' + parseFloat(valor || 0).toFixed(2).replace('.', ',');
};

const gerarCodigo = () => {
    return 'RP' + Math.floor(Math.random() * 9000 + 1000);
};

const mostrarToast = (mensagem) => {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
};

// ==================== TEMA ====================
const toggleTheme = () => {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    const isDark = html.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        html.removeAttribute('data-theme');
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
};

// Carregar tema salvo
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
    
    // Data atual
    const hoje = new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1);
    
    atualizarDashboard();
    carregarEstoque();
    carregarVendas();
    atualizarRelatorio();
    carregarSelectProdutos();
});

// ==================== NAVEGACAO ====================
const mostrarTela = (tela) => {
    // Esconder todas as telas
    document.querySelectorAll('.tela').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Mostrar tela selecionada
    const telaEl = document.getElementById('tela-' + tela);
    if (telaEl) telaEl.classList.add('active');
    
    // Atualizar nav
    const navItem = document.querySelector(`.nav-item[data-tela="${tela}"]`);
    if (navItem) navItem.classList.add('active');
    
    // Atualizar dados
    if (tela === 'dashboard') atualizarDashboard();
    if (tela === 'estoque') carregarEstoque();
    if (tela === 'vendas') carregarVendas();
    if (tela === 'relatorio') atualizarRelatorio();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==================== MODAL ====================
const abrirModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (modalId === 'modal-vender') {
            carregarSelectProdutos();
        }
    }
};

const fecharModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Limpar formularios
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
};

// Fechar modal ao clicar fora
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        fecharModal(e.target.id);
    }
};

// ==================== DADOS ====================
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];

const salvarProdutos = () => localStorage.setItem('produtos', JSON.stringify(produtos));
const salvarVendas = () => localStorage.setItem('vendas', JSON.stringify(vendas));

// ==================== DASHBOARD ====================
const atualizarDashboard = () => {
    const totalProdutos = produtos.length;
    const hoje = new Date().toLocaleDateString();
    const vendasHoje = vendas.filter(v => v.data === hoje).reduce((sum, v) => sum + v.quantidade, 0);
    
    let lucroTotal = 0;
    let investido = 0;
    
    produtos.forEach(p => {
        const qtdVendida = p.quantidadeVendida || 0;
        investido += p.custo * p.quantidade;
        lucroTotal += (p.venda - p.custo) * qtdVendida;
    });
    
    const elProdutos = document.getElementById('dashTotalProdutos');
    const elVendas = document.getElementById('dashTotalVendas');
    const elLucro = document.getElementById('dashLucroTotal');
    const elInvestido = document.getElementById('dashInvestido');
    
    if (elProdutos) elProdutos.textContent = totalProdutos;
    if (elVendas) elVendas.textContent = vendasHoje;
    if (elLucro) elLucro.textContent = formatarValor(lucroTotal);
    if (elInvestido) elInvestido.textContent = formatarValor(investido);
};

// ==================== CADASTRAR PRODUTO ====================
const calcularPrecoVenda = () => {
    const custo = parseFloat(document.getElementById('custoProduto').value) || 0;
    const margem = parseFloat(document.getElementById('margemProduto').value) || 0;
    const preco = custo + (custo * margem / 100);
    document.getElementById('precoVenda').value = formatarValor(preco);
};

const cadastrarProduto = (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nomeProduto').value.trim();
    const quantidade = parseInt(document.getElementById('qtdProduto').value) || 0;
    const custo = parseFloat(document.getElementById('custoProduto').value) || 0;
    const margem = parseFloat(document.getElementById('margemProduto').value) || 0;
    const venda = custo + (custo * margem / 100);
    
    if (!nome || quantidade <= 0 || custo <= 0) {
        mostrarToast('Preencha todos os campos corretamente!');
        return;
    }
    
    const produto = {
        id: Date.now(),
        codigo: gerarCodigo(),
        nome,
        quantidade,
        quantidadeVendida: 0,
        custo,
        margem,
        venda,
        data: new Date().toLocaleDateString()
    };
    
    produtos.push(produto);
    salvarProdutos();
    
    fecharModal('modal-cadastrar');
    mostrarToast('Produto cadastrado com sucesso!');
    atualizarDashboard();
    carregarEstoque();
};

// ==================== ESTOQUE ====================
let filtroAtual = 'todos';
let buscaAtual = '';

const carregarEstoque = () => {
    const lista = document.getElementById('listaEstoque');
    if (!lista) return;
    
    let filtrados = produtos;
    
    // Filtro de busca
    if (buscaAtual) {
        filtrados = filtrados.filter(p => 
            p.nome.toLowerCase().includes(buscaAtual.toLowerCase()) ||
            p.codigo.toLowerCase().includes(buscaAtual.toLowerCase())
        );
    }
    
    // Filtro de status
    if (filtroAtual === 'disponivel') {
        filtrados = filtrados.filter(p => p.quantidade > (p.quantidadeVendida || 0));
    } else if (filtroAtual === 'vendido') {
        filtrados = filtrados.filter(p => (p.quantidadeVendida || 0) > 0);
    }
    
    if (filtrados.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>Nenhum produto encontrado</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = filtrados.map(p => {
        const disponivel = p.quantidade - (p.quantidadeVendida || 0);
        const percentual = Math.round((disponivel / p.quantidade) * 100);
        
        let status = 'disponivel';
        let statusText = 'Disponível';
        if (disponivel === 0) {
            status = 'vendido';
            statusText = 'Vendido';
        } else if (p.quantidadeVendida > 0) {
            status = 'parcial';
            statusText = `${percentual}%`;
        }
        
        return `
            <div class="product-card" onclick="verDetalhesProduto(${p.id})">
                <div class="product-img">
                    <i class="fas fa-tshirt"></i>
                </div>
                <div class="product-info">
                    <div class="product-name">${p.nome}</div>
                    <div class="product-meta">
                        <span class="status-badge status-${status}">${statusText}</span>
                        <span>${p.codigo}</span>
                    </div>
                </div>
                <div class="product-price">
                    <div class="price">${formatarValor(p.venda)}</div>
                    <div class="stock">${disponivel}/${p.quantidade} disp.</div>
                </div>
            </div>
        `;
    }).join('');
};

const filtrarEstoque = () => {
    buscaAtual = document.getElementById('buscaEstoque').value;
    carregarEstoque();
};

const filtrarStatus = (status, btn) => {
    filtroAtual = status;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    carregarEstoque();
};

const verDetalhesProduto = (id) => {
    const p = produtos.find(prod => prod.id === id);
    if (!p) return;
    
    const disponivel = p.quantidade - (p.quantidadeVendida || 0);
    
    if (confirm(`${p.nome}\nCódigo: ${p.codigo}\nQuantidade: ${p.quantidade}\nVendido: ${p.quantidadeVendida || 0}\nDisponível: ${disponivel}\nCusto: ${formatarValor(p.custo)}\nVenda: ${formatarValor(p.venda)}\n\nDeseja excluir este produto?`)) {
        produtos = produtos.filter(prod => prod.id !== id);
        salvarProdutos();
        mostrarToast('Produto excluído!');
        carregarEstoque();
        atualizarDashboard();
    }
};

// ==================== VENDAS ====================
const carregarSelectProdutos = () => {
    const select = document.getElementById('selectProduto');
    if (!select) return;
    
    const disponiveis = produtos.filter(p => p.quantidade > (p.quantidadeVendida || 0));
    
    select.innerHTML = '<option value="">Selecione um produto</option>' +
        disponiveis.map(p => {
            const disp = p.quantidade - (p.quantidadeVendida || 0);
            return `<option value="${p.id}" data-custo="${p.custo}" data-venda="${p.venda}" data-disp="${disp}">
                ${p.nome} (${disp} disp.)
            </option>`;
        }).join('');
};

const atualizarInfoVenda = () => {
    const select = document.getElementById('selectProduto');
    const qtd = parseInt(document.getElementById('qtdVenda').value) || 0;
    
    if (!select.value) {
        document.getElementById('dispVenda').value = '-';
        document.getElementById('precoUnitVenda').textContent = formatarValor(0);
        document.getElementById('totalVenda').textContent = formatarValor(0);
        document.getElementById('lucroVenda').textContent = formatarValor(0);
        return;
    }
    
    const option = select.options[select.selectedIndex];
    const vendaUnit = parseFloat(option.dataset.venda);
    const custoUnit = parseFloat(option.dataset.custo);
    const disp = parseInt(option.dataset.disp);
    
    document.getElementById('dispVenda').value = disp;
    document.getElementById('precoUnitVenda').textContent = formatarValor(vendaUnit);
    document.getElementById('totalVenda').textContent = formatarValor(vendaUnit * qtd);
    document.getElementById('lucroVenda').textContent = formatarValor((vendaUnit - custoUnit) * qtd);
};

const registrarVenda = (e) => {
    e.preventDefault();
    
    const produtoId = parseInt(document.getElementById('selectProduto').value);
    const qtd = parseInt(document.getElementById('qtdVenda').value);
    
    if (!produtoId || !qtd) {
        mostrarToast('Selecione um produto e quantidade!');
        return;
    }
    
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) {
        mostrarToast('Produto não encontrado!');
        return;
    }
    
    const disponivel = produto.quantidade - (produto.quantidadeVendida || 0);
    if (qtd > disponivel) {
        mostrarToast(`Apenas ${disponivel} unidades disponíveis!`);
        return;
    }
    
    // Atualizar produto
    produto.quantidadeVendida = (produto.quantidadeVendida || 0) + qtd;
    salvarProdutos();
    
    // Registrar venda
    const venda = {
        id: Date.now(),
        data: new Date().toLocaleDateString(),
        produtoId: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        quantidade: qtd,
        vendaUnit: produto.venda,
        total: produto.venda * qtd,
        lucro: (produto.venda - produto.custo) * qtd
    };
    
    vendas.push(venda);
    salvarVendas();
    
    fecharModal('modal-vender');
    mostrarToast('Venda registrada com sucesso!');
    atualizarDashboard();
    carregarVendas();
    carregarEstoque();
};

const carregarVendas = () => {
    const lista = document.getElementById('listaVendas');
    if (!lista) return;
    
    let totalVendido = 0;
    let totalLucro = 0;
    
    vendas.forEach(v => {
        totalVendido += v.total;
        totalLucro += v.lucro;
    });
    
    const elTotal = document.getElementById('vendasTotal');
    const elLucro = document.getElementById('vendasLucro');
    if (elTotal) elTotal.textContent = formatarValor(totalVendido);
    if (elLucro) elLucro.textContent = formatarValor(totalLucro);
    
    if (vendas.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <p>Nenhuma venda registrada</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = vendas.slice().reverse().map(v => `
        <div class="sale-card">
            <div class="product-img" style="width:44px;height:44px;font-size:1.2rem;">
                <i class="fas fa-shopping-bag"></i>
            </div>
            <div class="sale-info">
                <div class="sale-product">${v.nome}</div>
                <div class="sale-detail">${v.data} · ${v.quantidade} un · ${v.codigo}</div>
            </div>
            <div class="sale-value">
                <div class="value">${formatarValor(v.total)}</div>
                <div class="profit">+${formatarValor(v.lucro)}</div>
            </div>
        </div>
    `).join('');
};

// ==================== RELATORIO ====================
const atualizarRelatorio = () => {
    let totalInvestido = 0;
    let totalVendido = 0;
    let lucroReal = 0;
    let valorEstoque = 0;
    
    produtos.forEach(p => {
        const qtdVendida = p.quantidadeVendida || 0;
        const qtdEstoque = p.quantidade - qtdVendida;
        
        totalInvestido += p.custo * p.quantidade;
        totalVendido += p.venda * qtdVendida;
        lucroReal += (p.venda - p.custo) * qtdVendida;
        valorEstoque += p.custo * qtdEstoque;
    });
    
    const elInvestido = document.getElementById('relInvestido');
    const elVendido = document.getElementById('relVendido');
    const elLucro = document.getElementById('relLucro');
    const elEstoque = document.getElementById('relEstoque');
    
    if (elInvestido) elInvestido.textContent = formatarValor(totalInvestido);
    if (elVendido) elVendido.textContent = formatarValor(totalVendido);
    if (elLucro) elLucro.textContent = formatarValor(lucroReal);
    if (elEstoque) elEstoque.textContent = formatarValor(valorEstoque);
    
    // Progresso ROI
    const roi = totalInvestido > 0 ? Math.min((totalVendido / totalInvestido) * 100, 100) : 0;
    const progressFill = document.getElementById('progressROI');
    const textROI = document.getElementById('textROI');
    
    if (progressFill) {
        setTimeout(() => progressFill.style.width = roi + '%', 100);
    }
    if (textROI) textROI.textContent = roi.toFixed(1) + '% do investimento retornado';
};

// ==================== EVENT LISTENERS ====================
document.getElementById('formCadastrar')?.addEventListener('submit', cadastrarProduto);
document.getElementById('formVender')?.addEventListener('submit', registrarVenda);
