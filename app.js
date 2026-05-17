// ==================== FIREBASE CONFIG ====================
// Configuracao sera carregada do firebase-config.js

// ==================== UTILITARIOS ====================
function formatarValor(valor) {
    return 'R$ ' + parseFloat(valor || 0).toFixed(2).replace('.', ',');
}

function gerarCodigo() {
    return 'RP' + Math.floor(Math.random() * 9000 + 1000);
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast) return;
    toastMsg.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ==================== VARIAVEIS GLOBAIS ====================
let produtos = [];
let vendas = [];
let db = null;
let userId = null;

// ==================== INICIALIZACAO FIREBASE ====================
async function inicializarFirebase() {
    // Verificar se Firebase esta disponivel
    if (typeof firebase === 'undefined') {
        console.log('Firebase nao disponivel, usando localStorage');
        usarLocalStorage();
        return;
    }
    
    try {
        db = firebase.firestore();
        
        // Autenticar usuario anonimamente
        const authUid = await autenticarUsuario();
        
        // Usar UID do Firebase como ID do usuario
        userId = authUid || localStorage.getItem('mm_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('mm_user_id', userId);
        }
        
        console.log('Firebase inicializado. UserID:', userId);
        
        // Carregar dados do Firestore
        await carregarDadosFirestore();
        
        // Escutar mudancas em tempo real
        escutarMudancas();
        
    } catch (erro) {
        console.error('Erro ao inicializar Firebase:', erro);
        usarLocalStorage();
    }
}

// ==================== FIRESTORE: CARREGAR DADOS ====================
async function carregarDadosFirestore() {
    if (!db) return;
    
    try {
        // Carregar produtos
        const produtosDoc = await db.collection('dados').doc(userId).get();
        if (produtosDoc.exists) {
            const dados = produtosDoc.data();
            produtos = dados.produtos || [];
            vendas = dados.vendas || [];
            console.log('Dados carregados do Firestore:', produtos.length, 'produtos,', vendas.length, 'vendas');
        } else {
            // Primeiro acesso - tentar migrar do localStorage
            const produtosLocal = localStorage.getItem('produtos');
            const vendasLocal = localStorage.getItem('vendas');
            
            if (produtosLocal || vendasLocal) {
                produtos = JSON.parse(produtosLocal || '[]');
                vendas = JSON.parse(vendasLocal || '[]');
                await salvarDadosFirestore();
                console.log('Dados migrados do localStorage para Firestore');
            }
        }
        
        atualizarTodasTelas();
        
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        usarLocalStorage();
    }
}

// ==================== FIRESTORE: SALVAR DADOS ====================
async function salvarDadosFirestore() {
    if (!db) {
        // Fallback para localStorage
        localStorage.setItem('produtos', JSON.stringify(produtos));
        localStorage.setItem('vendas', JSON.stringify(vendas));
        return;
    }
    
    try {
        await db.collection('dados').doc(userId).set({
            produtos: produtos,
            vendas: vendas,
            ultimaAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Dados salvos no Firestore');
    } catch (erro) {
        console.error('Erro ao salvar:', erro);
        // Fallback para localStorage
        localStorage.setItem('produtos', JSON.stringify(produtos));
        localStorage.setItem('vendas', JSON.stringify(vendas));
    }
}

// ==================== FIRESTORE: ESCUTAR MUDANCAS ====================
function escutarMudancas() {
    if (!db) return;
    
    db.collection('dados').doc(userId).onSnapshot((doc) => {
        if (doc.exists) {
            const dados = doc.data();
            const novosProdutos = dados.produtos || [];
            const novasVendas = dados.vendas || [];
            
            // Verificar se houve mudancas
            if (JSON.stringify(produtos) !== JSON.stringify(novosProdutos) ||
                JSON.stringify(vendas) !== JSON.stringify(novasVendas)) {
                
                produtos = novosProdutos;
                vendas = novasVendas;
                console.log('Dados atualizados em tempo real');
                atualizarTodasTelas();
            }
        }
    }, (erro) => {
        console.error('Erro ao escutar mudancas:', erro);
    });
}

// ==================== LOCALSTORAGE FALLBACK ====================
function usarLocalStorage() {
    console.log('Usando localStorage como fallback');
    db = null;
    
    const produtosLocal = localStorage.getItem('produtos');
    const vendasLocal = localStorage.getItem('vendas');
    
    produtos = JSON.parse(produtosLocal || '[]');
    vendas = JSON.parse(vendasLocal || '[]');
    
    atualizarTodasTelas();
}

// ==================== ATUALIZAR TODAS AS TELAS ====================
function atualizarTodasTelas() {
    if (isMobile) {
        atualizarDashboard();
        carregarEstoqueMobile();
        carregarVendasMobile();
        atualizarRelatorioMobile();
    } else {
        carregarEstoqueDesktop();
        carregarSelectProdutosDesktop();
        carregarVendasDesktop();
        atualizarRelatorioDesktop();
    }
}

// ==================== DETECTAR VERSAO ====================
const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ==================== DESKTOP: ABAS ====================
function mostrarAba(aba) {
    document.querySelectorAll('.aba-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('aba-' + aba).classList.add('active');
    event.target.classList.add('active');
    
    if (aba === 'estoque') carregarEstoqueDesktop();
    if (aba === 'vendas') carregarVendasDesktop();
    if (aba === 'relatorio') atualizarRelatorioDesktop();
}

// ==================== DESKTOP: ESTOQUE ====================
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
    salvarDadosFirestore();
    
    alert('Produto cadastrado com sucesso!');
    limparFormulario();
    carregarEstoqueDesktop();
    if (isMobile) atualizarDashboard();
}

function carregarEstoqueDesktop(filtro) {
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
    carregarEstoqueDesktop(filtro);
}

function excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    produtos = produtos.filter(p => p.id !== id);
    salvarDadosFirestore();
    carregarEstoqueDesktop();
    if (isMobile) atualizarDashboard();
}

function limparFormulario() {
    document.getElementById('produtoForm').reset();
    document.getElementById('venda').value = '';
}

// ==================== DESKTOP: VENDAS ====================
function carregarSelectProdutosDesktop() {
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

function registrarVendaDesktop(e) {
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
    
    produto.quantidadeVendida = (produto.quantidadeVendida || 0) + qtd;
    
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
    salvarDadosFirestore();
    
    alert('Venda registrada com sucesso!');
    document.getElementById('vendaForm').reset();
    document.getElementById('precoVenda').value = '';
    document.getElementById('totalVenda').value = '';
    document.getElementById('lucroVenda').value = '';
    document.getElementById('lucroTotalVenda').value = '';
    
    carregarVendasDesktop();
    carregarSelectProdutosDesktop();
    if (isMobile) atualizarDashboard();
}

function carregarVendasDesktop() {
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

// ==================== DESKTOP: RELATORIO ====================
function atualizarRelatorioDesktop() {
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

// ==================== MOBILE: NAVEGACAO ====================
function mostrarTela(tela) {
    document.querySelectorAll('.tela').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const telaEl = document.getElementById('tela-' + tela);
    if (telaEl) telaEl.classList.add('active');
    
    const navItem = document.querySelector(`.nav-item[data-tela="${tela}"]`);
    if (navItem) navItem.classList.add('active');
    
    if (tela === 'dashboard') atualizarDashboard();
    if (tela === 'estoque') carregarEstoqueMobile();
    if (tela === 'vendas') carregarVendasMobile();
    if (tela === 'relatorio') atualizarRelatorioMobile();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== MOBILE: MODAL ====================
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (modalId === 'modal-vender') {
            carregarSelectProdutosMobile();
        }
    }
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        fecharModal(e.target.id);
    }
};

// ==================== MOBILE: DASHBOARD ====================
function atualizarDashboard() {
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
}

// ==================== MOBILE: CADASTRAR ====================
function calcularPrecoVendaMobile() {
    const custo = parseFloat(document.getElementById('custoProduto').value) || 0;
    const margem = parseFloat(document.getElementById('margemProduto').value) || 0;
    const preco = custo + (custo * margem / 100);
    document.getElementById('precoVenda').value = formatarValor(preco);
}

function cadastrarProdutoMobile(e) {
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
    salvarDadosFirestore();
    
    fecharModal('modal-cadastrar');
    mostrarToast('Produto cadastrado com sucesso!');
    atualizarDashboard();
    carregarEstoqueMobile();
}

// ==================== MOBILE: ESTOQUE ====================
let filtroAtual = 'todos';
let buscaAtual = '';

function carregarEstoqueMobile() {
    const lista = document.getElementById('listaEstoqueMobile');
    if (!lista) return;
    
    let filtrados = produtos;
    
    if (buscaAtual) {
        filtrados = filtrados.filter(p => 
            p.nome.toLowerCase().includes(buscaAtual.toLowerCase()) ||
            p.codigo.toLowerCase().includes(buscaAtual.toLowerCase())
        );
    }
    
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
        let statusText = 'Disponivel';
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
}

function filtrarEstoqueMobile() {
    buscaAtual = document.getElementById('buscaEstoque').value;
    carregarEstoqueMobile();
}

function filtrarStatusMobile(status, btn) {
    filtroAtual = status;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    carregarEstoqueMobile();
}

function verDetalhesProduto(id) {
    const p = produtos.find(prod => prod.id === id);
    if (!p) return;
    
    const disponivel = p.quantidade - (p.quantidadeVendida || 0);
    
    if (confirm(`${p.nome}\nCodigo: ${p.codigo}\nQuantidade: ${p.quantidade}\nVendido: ${p.quantidadeVendida || 0}\nDisponivel: ${disponivel}\nCusto: ${formatarValor(p.custo)}\nVenda: ${formatarValor(p.venda)}\n\nDeseja excluir este produto?`)) {
        produtos = produtos.filter(prod => prod.id !== id);
        salvarDadosFirestore();
        mostrarToast('Produto excluido!');
        carregarEstoqueMobile();
        atualizarDashboard();
    }
}

// ==================== MOBILE: VENDAS ====================
function carregarSelectProdutosMobile() {
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
}

function atualizarInfoVendaMobile() {
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
}

function registrarVendaMobile(e) {
    e.preventDefault();
    
    const produtoId = parseInt(document.getElementById('selectProduto').value);
    const qtd = parseInt(document.getElementById('qtdVenda').value);
    
    if (!produtoId || !qtd) {
        mostrarToast('Selecione um produto e quantidade!');
        return;
    }
    
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) {
        mostrarToast('Produto nao encontrado!');
        return;
    }
    
    const disponivel = produto.quantidade - (produto.quantidadeVendida || 0);
    if (qtd > disponivel) {
        mostrarToast(`Apenas ${disponivel} unidades disponiveis!`);
        return;
    }
    
    produto.quantidadeVendida = (produto.quantidadeVendida || 0) + qtd;
    
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
    salvarDadosFirestore();
    
    fecharModal('modal-vender');
    mostrarToast('Venda registrada com sucesso!');
    atualizarDashboard();
    carregarVendasMobile();
    carregarEstoqueMobile();
}

function carregarVendasMobile() {
    const lista = document.getElementById('listaVendasMobile');
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
            <div class="product-img" style="width:40px;height:40px;font-size:1rem;">
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
}

// ==================== MOBILE: RELATORIO ====================
function atualizarRelatorioMobile() {
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
    
    const roi = totalInvestido > 0 ? Math.min((totalVendido / totalInvestido) * 100, 100) : 0;
    const progressFill = document.getElementById('progressROI');
    const textROI = document.getElementById('textROI');
    
    if (progressFill) {
        setTimeout(() => progressFill.style.width = roi + '%', 100);
    }
    if (textROI) textROI.textContent = roi.toFixed(1) + '% do investimento retornado';
}

// ==================== TEMA ====================
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    const isDark = html.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        html.removeAttribute('data-theme');
        if (icon) icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        if (icon) icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Firebase primeiro
    inicializarFirebase();
    
    // Carregar tema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
    
    // Data atual mobile
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const hoje = new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        dateEl.textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1);
    }
    
    // Desktop event listeners
    const custoInput = document.getElementById('custo');
    const porcentagemInput = document.getElementById('porcentagem');
    if (custoInput) custoInput.addEventListener('input', calcularValores);
    if (porcentagemInput) porcentagemInput.addEventListener('input', calcularValores);
    
    const produtoForm = document.getElementById('produtoForm');
    if (produtoForm) produtoForm.addEventListener('submit', adicionarProduto);
    
    const produtoVenda = document.getElementById('produtoVenda');
    const qtdVenda = document.getElementById('quantidadeVenda');
    if (produtoVenda) produtoVenda.addEventListener('change', calcularVenda);
    if (qtdVenda) qtdVenda.addEventListener('input', calcularVenda);
    
    const vendaForm = document.getElementById('vendaForm');
    if (vendaForm) vendaForm.addEventListener('submit', registrarVendaDesktop);
});



// ==================== SINCRONIZAR DADOS ====================
async function sincronizarDados() {
    if (!db) {
        alert('Firebase nao disponivel. Verifique sua conexao.');
        return;
    }
    
    try {
        // Pegar dados do localStorage
        const produtosLocal = JSON.parse(localStorage.getItem('produtos') || '[]');
        const vendasLocal = JSON.parse(localStorage.getItem('vendas') || '[]');
        
        if (produtosLocal.length === 0 && vendasLocal.length === 0) {
            alert('Nenhum dado local para sincronizar.');
            return;
        }
        
        // Mesclar com dados do Firebase (evitar duplicatas)
        const produtosExistentes = produtos.map(p => p.id);
        const vendasExistentes = vendas.map(v => v.id);
        
        let novosProdutos = 0;
        let novasVendas = 0;
        
        produtosLocal.forEach(p => {
            if (!produtosExistentes.includes(p.id)) {
                produtos.push(p);
                novosProdutos++;
            }
        });
        
        vendasLocal.forEach(v => {
            if (!vendasExistentes.includes(v.id)) {
                vendas.push(v);
                novasVendas++;
            }
        });
        
        // Salvar no Firebase
        await salvarDadosFirestore();
        
        // Limpar localStorage
        localStorage.removeItem('produtos');
        localStorage.removeItem('vendas');
        
        alert('Sincronizado! ' + novosProdutos + ' produtos, ' + novasVendas + ' vendas enviados para a nuvem.');
        atualizarTodasTelas();
        
    } catch (erro) {
        console.error('Erro ao sincronizar:', erro);
        alert('Erro ao sincronizar. Tente novamente.');
    }
}
