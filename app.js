// ==================== UTILITARIOS ====================
function formatarValor(valor) {
    return 'R$ ' + parseFloat(valor).toFixed(2).replace('.', ',');
}

function gerarCodigo() {
    return 'RP' + Math.floor(Math.random() * 9000 + 1000);
}

// ==================== CONTROLE DE ABAS ====================
function mostrarAba(aba) {
    // Esconder todas as abas
    document.querySelectorAll('.aba-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    // Mostrar aba selecionada
    document.getElementById('aba-' + aba).classList.add('active');
    event.target.classList.add('active');
    
    // Atualizar dados
    if (aba === 'estoque') carregarEstoque();
    if (aba === 'vendas') carregarVendas();
    if (aba === 'relatorio') atualizarRelatorio();
}

// ==================== ESTOQUE ====================
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];

function salvarProdutos() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
}

function calcularValores() {
    const custo = parseFloat(document.getElementById('custo').value) || 0;
    const porcentagem = parseFloat(document.getElementById('porcentagem').value) || 0;
    
    if (custo > 0 && porcentagem >= 0) {
        const venda = custo + (custo * porcentagem / 100);
        document.getElementById('venda').value = formatarValor(venda);
    }
}

function adicionarProduto(e) {
    e.preventDefault();
    
    const custo = parseFloat(document.getElementById('custo').value) || 0;
    const porcentagem = parseFloat(document.getElementById('porcentagem').value) || 0;
    const venda = custo + (custo * porcentagem / 100);
    const quantidade = parseInt(document.getElementById('quantidade').value) || 0;
    
    const produto = {
        id: Date.now(),
        codigo: gerarCodigo(),
        nome: document.getElementById('nome').value,
        quantidade: quantidade,
        quantidadeVendida: 0,
        custo: custo,
        porcentagem: porcentagem,
        venda: venda,
        data: new Date().toLocaleDateString()
    };
    
    produtos.push(produto);
    salvarProdutos();
    
    alert('Produto cadastrado com sucesso!');
    limparFormulario();
    carregarEstoque();
}

function carregarEstoque(filtro = 'todos') {
    const tbody = document.getElementById('listaEstoque');
    if (!tbody) return;
    
    let produtosFiltrados = produtos;
    
    if (filtro === 'disponivel') {
        produtosFiltrados = produtos.filter(p => p.quantidade > p.quantidadeVendida);
    } else if (filtro === 'vendido') {
        produtosFiltrados = produtos.filter(p => p.quantidadeVendida > 0);
    }
    
    if (produtosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#999;">Nenhum produto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = produtosFiltrados.map(p => {
        const disponivel = p.quantidade - (p.quantidadeVendida || 0);
        let status = 'Disponivel';
        let statusClass = 'status-disponivel';
        
        if (disponivel === 0) {
            status = 'Vendido';
            statusClass = 'status-vendido';
        } else if (p.quantidadeVendida > 0) {
            status = 'Parcial';
            statusClass = 'status-parcial';
        }
        
        return `
            <tr>
                <td><strong>${p.codigo}</strong></td>
                <td>${p.nome}</td>
                <td>${p.quantidade}</td>
                <td>${p.quantidadeVendida || 0}</td>
                <td>${formatarValor(p.custo)}</td>
                <td>${formatarValor(p.venda)}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-danger" onclick="excluirProduto(${p.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarEstoque(filtro) {
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    carregarEstoque(filtro);
}

function excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    produtos = produtos.filter(p => p.id !== id);
    salvarProdutos();
    carregarEstoque();
}

function limparFormulario() {
    document.getElementById('produtoForm').reset();
    document.getElementById('venda').value = '';
}

// ==================== VENDAS ====================
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];

function salvarVendas() {
    localStorage.setItem('vendas', JSON.stringify(vendas));
}

function carregarSelectProdutos() {
    const select = document.getElementById('produtoVenda');
    if (!select) return;
    
    const disponiveis = produtos.filter(p => p.quantidade > (p.quantidadeVendida || 0));
    
    select.innerHTML = '<option value="">Escolha um produto disponivel</option>' +
        disponiveis.map(p => `
            <option value="${p.id}" data-custo="${p.custo}" data-venda="${p.venda}">
                ${p.codigo} - ${p.nome} (Disp: ${p.quantidade - (p.quantidadeVendida || 0)})
            </option>
        `).join('');
}

function calcularVenda() {
    const select = document.getElementById('produtoVenda');
    const qtd = parseInt(document.getElementById('quantidadeVenda').value) || 0;
    
    if (!select.value || qtd <= 0) return;
    
    const option = select.options[select.selectedIndex];
    const vendaUnit = parseFloat(option.dataset.venda);
    const custoUnit = parseFloat(option.dataset.custo);
    
    document.getElementById('precoVenda').value = formatarValor(vendaUnit);
    document.getElementById('totalVenda').value = formatarValor(vendaUnit * qtd);
    document.getElementById('lucroVenda').value = formatarValor(vendaUnit - custoUnit);
    document.getElementById('lucroTotalVenda').value = formatarValor((vendaUnit - custoUnit) * qtd);
}

function registrarVenda(e) {
    e.preventDefault();
    
    const produtoId = parseInt(document.getElementById('produtoVenda').value);
    const qtd = parseInt(document.getElementById('quantidadeVenda').value);
    
    if (!produtoId || !qtd) {
        alert('Selecione um produto e quantidade!');
        return;
    }
    
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) {
        alert('Produto nao encontrado!');
        return;
    }
    
    const disponivel = produto.quantidade - (produto.quantidadeVendida || 0);
    if (qtd > disponivel) {
        alert(`Quantidade indisponivel! Tem apenas ${disponivel} unidades.`);
        return;
    }
    
    // Atualizar quantidade vendida do produto
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
    
    alert('Venda registrada com sucesso!');
    document.getElementById('vendaForm').reset();
    document.getElementById('precoVenda').value = '';
    document.getElementById('totalVenda').value = '';
    document.getElementById('lucroVenda').value = '';
    document.getElementById('lucroTotalVenda').value = '';
    
    carregarVendas();
    carregarSelectProdutos();
}

function carregarVendas() {
    const tbody = document.getElementById('listaVendas');
    if (!tbody) return;
    
    if (vendas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">Nenhuma venda registrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = vendas.slice().reverse().map(v => `
        <tr>
            <td>${v.data}</td>
            <td><strong>${v.codigo}</strong></td>
            <td>${v.nome}</td>
            <td>${v.quantidade}</td>
            <td>${formatarValor(v.vendaUnit)}</td>
            <td>${formatarValor(v.total)}</td>
            <td><strong style="color:#27ae60;">${formatarValor(v.lucro)}</strong></td>
        </tr>
    `).join('');
}

// ==================== RELATORIO ====================
function atualizarRelatorio() {
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
    
    const elInvestido = document.getElementById('totalInvestido');
    const elVendido = document.getElementById('totalVendido');
    const elLucro = document.getElementById('totalLucro');
    const elEstoque = document.getElementById('totalEstoque');
    
    if (elInvestido) elInvestido.textContent = formatarValor(totalInvestido);
    if (elVendido) elVendido.textContent = formatarValor(totalVendido);
    if (elLucro) elLucro.textContent = formatarValor(lucroReal);
    if (elEstoque) elEstoque.textContent = formatarValor(valorEstoque);
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Estoque
    carregarEstoque();
    document.getElementById('custo').addEventListener('input', calcularValores);
    document.getElementById('porcentagem').addEventListener('input', calcularValores);
    document.getElementById('produtoForm').addEventListener('submit', adicionarProduto);
    
    // Vendas
    carregarSelectProdutos();
    document.getElementById('produtoVenda').addEventListener('change', calcularVenda);
    document.getElementById('quantidadeVenda').addEventListener('input', calcularVenda);
    document.getElementById('vendaForm').addEventListener('submit', registrarVenda);
    
    // Relatorio
    atualizarRelatorio();
});
