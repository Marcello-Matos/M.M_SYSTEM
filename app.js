console.log('✓ app.js v7 carregado com sucesso!');

// ==================== CONFIGURACAO ====================
const PIN_PADRAO = '1234';
const LOGIN_USUARIO = 'admin';
const LOGIN_SENHA = 'admin123';

function gerarAccountCode() {
    // Gera código único: MM_XXXXX (5 caracteres aleatórios)
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = 'MM_';
    for (let i = 0; i < 5; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

function getUserId() {
    // Conta única fixa: todos os dispositivos compartilham os mesmos dados
    return 'account_MM_SYSTEM_MAIN';
}

function liberarSistema() {
    const loginScreen = document.getElementById('login-screen');
    const desktopVersion = document.getElementById('desktop-version');
    const mobileVersion = document.getElementById('mobile-version');
    
    document.body.classList.remove('login-active');
    if (loginScreen) loginScreen.style.display = 'none';
    if (desktopVersion) desktopVersion.classList.remove('app-locked');
    if (mobileVersion) mobileVersion.classList.remove('app-locked');
}

function bloquearSistema() {
    const loginScreen = document.getElementById('login-screen');
    const desktopVersion = document.getElementById('desktop-version');
    const mobileVersion = document.getElementById('mobile-version');
    const loginForm = document.getElementById('loginForm');
    const erro = document.getElementById('loginErro');
    
    document.body.classList.add('login-active');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (desktopVersion) desktopVersion.classList.add('app-locked');
    if (mobileVersion) mobileVersion.classList.add('app-locked');
    if (loginForm) loginForm.reset();
    if (erro) erro.textContent = '';
}

function logoutSistema() {
    localStorage.removeItem('mm_login_autenticado');
    sessionStorage.removeItem('mm_login_autenticado');
    bloquearSistema();
}

function autenticarLogin(e) {
    e.preventDefault();
    
    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const lembrar = document.getElementById('lembrarLogin').checked;
    const erro = document.getElementById('loginErro');
    
    if (usuario === LOGIN_USUARIO && senha === LOGIN_SENHA) {
        if (lembrar) {
            localStorage.setItem('mm_login_autenticado', 'true');
        } else {
            sessionStorage.setItem('mm_login_autenticado', 'true');
        }
        liberarSistema();
        init();
        return;
    }
    
    if (erro) erro.textContent = 'Login ou senha inválidos';
}

function configurarLogin() {
    document.body.classList.add('login-active');
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', autenticarLogin);
    
    const autenticado = localStorage.getItem('mm_login_autenticado') === 'true' || sessionStorage.getItem('mm_login_autenticado') === 'true';
    if (autenticado) {
        liberarSistema();
        init();
    }
}

function getAccountCode() {
    let accountCode = localStorage.getItem('mm_account_code');
    if (!accountCode) {
        accountCode = gerarAccountCode();
        localStorage.setItem('mm_account_code', accountCode);
    }
    return accountCode;
}

async function sincronizarComCodigo(codigoDigitado) {
    try {
        codigoDigitado = codigoDigitado.toUpperCase().trim();
        
        // Validar formato do código
        if (!codigoDigitado.match(/^MM_[A-Z0-9]{5}$/)) {
            mostrarToast('❌ Código inválido! Formato: MM_XXXXX');
            return false;
        }
        
        // Não permitir sincronizar com o próprio código
        if (codigoDigitado === getAccountCode()) {
            mostrarToast('⚠️ Este é seu próprio código!');
            return false;
        }
        
        mostrarToast('⏳ Verificando código...');
        
        // Tentar carregar dados da conta fornecida
        const novoUserId = 'account_' + codigoDigitado;
        const doc = await db.collection('dados').doc(novoUserId).get();
        
        if (doc.exists) {
            // Conta existe, vamos sincronizar
            localStorage.setItem('mm_account_code', codigoDigitado);
            mostrarToast('✅ Sincronizado! Atualizando...');
            // Esperar um pouco e recarregar
            setTimeout(() => location.reload(), 1000);
            return true;
        } else {
            mostrarToast('❌ Conta não encontrada. Verifique o código!');
            return false;
        }
    } catch (e) {
        console.error('Erro ao sincronizar:', e);
        mostrarToast('❌ Erro ao sincronizar. Tente novamente.');
        return false;
    }
}

function copiarCodigoConta() {
    const codigo = getAccountCode();
    navigator.clipboard.writeText(codigo).then(() => {
        mostrarToast('✅ Código copiado: ' + codigo);
    }).catch(() => {
        alert('Seu código de conta é:\n\n' + codigo + '\n\nCompartilhe este código em seus outros dispositivos para sincronizar!');
    });
}

function mostrarTelaSync() {
    const codigo = getAccountCode();
    alert(
        '📱 SINCRONIZAR ENTRE DISPOSITIVOS\n\n' +
        'Seu código de conta:\n\n' +
        codigo + '\n\n' +
        'Para sincronizar em OUTRO dispositivo:\n' +
        '1. Abra esta aplicação no outro dispositivo\n' +
        '2. Clique em "⚙️ Sincronizar"\n' +
        '3. Digite este código: ' + codigo + '\n\n' +
        'Todos os dados aparecerão automaticamente!'
    );
}

function abrirModalSync() {
    const codigo = getAccountCode();
    document.getElementById('meuCodigo').textContent = codigo;
    document.getElementById('inputCodigoSync').value = '';
    abrirModal('modal-sincronizar');
}

function registrarSincronizacao(e) {
    e.preventDefault();
    const codigoDigitado = document.getElementById('inputCodigoSync').value.toUpperCase();
    sincronizarComCodigo(codigoDigitado);
}



// ==================== FIREBASE ====================
const db = firebase.firestore();
const userId = getUserId();

// ==================== DADOS ====================
let produtos = [];
let vendas = [];
let sincronizandoPendencias = false;

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

function salvarLocalPendente() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('vendas', JSON.stringify(vendas));
    localStorage.setItem('mm_sync_pendente', 'true');
    localStorage.setItem('mm_sync_pendente_em', new Date().toISOString());
}

function existeSincronizacaoPendente() {
    return localStorage.getItem('mm_sync_pendente') === 'true';
}

function carregarDadosLocaisPendentes() {
    produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
    vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
}

async function sincronizarPendencias() {
    if (sincronizandoPendencias || !existeSincronizacaoPendente() || !navigator.onLine) return;
    
    try {
        sincronizandoPendencias = true;
        carregarDadosLocaisPendentes();
        await db.collection('dados').doc(userId).set({
            produtos: produtos,
            vendas: vendas,
            ultimaAtualizacao: new Date().toISOString(),
            sincronizadoOffline: true
        });
        localStorage.removeItem('mm_sync_pendente');
        localStorage.removeItem('mm_sync_pendente_em');
        mostrarToast('✅ Dados offline sincronizados!');
        atualizarTodasTelas();
    } catch (e) {
        console.error('Erro ao sincronizar pendências:', e);
    } finally {
        sincronizandoPendencias = false;
    }
}

// ==================== INICIALIZAR ====================
async function init() {
    try {
        await firebase.auth().signInAnonymously();
        console.log('Autenticado. UserID:', userId);
        
        if (existeSincronizacaoPendente()) {
            carregarDadosLocaisPendentes();
            await sincronizarPendencias();
        } else {
            const doc = await db.collection('dados').doc(userId).get();
            if (doc.exists) {
                const dados = doc.data();
                produtos = dados.produtos || [];
                vendas = dados.vendas || [];
            }
        }
        
        atualizarTodasTelas();
        
        db.collection('dados').doc(userId).onSnapshot((doc) => {
            if (existeSincronizacaoPendente()) return;
            if (doc.exists) {
                const dados = doc.data();
                produtos = dados.produtos || [];
                vendas = dados.vendas || [];
                atualizarTodasTelas();
            }
        });
        
    } catch (e) {
        console.error('Erro:', e);
        mostrarToast('⚠️ Erro no Firebase. Usando dados locais.');
        carregarDadosLocaisPendentes();
        atualizarTodasTelas();
    }
}

async function salvarDados() {
    try {
        await db.collection('dados').doc(userId).set({
            produtos: produtos,
            vendas: vendas,
            ultimaAtualizacao: new Date().toISOString()
        });
        localStorage.removeItem('mm_sync_pendente');
        localStorage.removeItem('mm_sync_pendente_em');
        console.log('Dados salvos');
    } catch (e) {
        console.error('Erro ao salvar:', e);
        mostrarToast('⚠️ Erro ao salvar. Dados mantidos localmente.');
        salvarLocalPendente();
    }
}

// ==================== ATUALIZAR TELAS ====================
function atualizarTodasTelas() {
    const isMobile = window.innerWidth <= 768;
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

// ==================== DESKTOP ====================
function mostrarAba(aba, event) {
    document.querySelectorAll('.aba-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('aba-' + aba).classList.add('active');
    const btn = document.querySelector(`.tab-btn[onclick*="${aba}"]`);
    if (btn) btn.classList.add('active');
}

function calcularValores() {
    const custoEl = document.getElementById('custo');
    const porcentagemEl = document.getElementById('porcentagem');
    const vendaEl = document.getElementById('venda');
    
    if (!custoEl || !porcentagemEl || !vendaEl) {
        return;
    }
    
    const custo = parseFloat(String(custoEl.value).replace(',', '.')) || 0;
    const porcentagem = parseFloat(String(porcentagemEl.value).replace(',', '.')) || 0;
    const valorVenda = custo + (custo * porcentagem / 100);
    vendaEl.dataset.valor = valorVenda.toFixed(2);
    vendaEl.value = formatarValor(valorVenda);
}

function adicionarProduto(e) {
    e.preventDefault();
    const custo = parseFloat(document.getElementById('custo').value) || 0;
    const porcentagem = parseFloat(document.getElementById('porcentagem').value) || 0;
    const quantidade = parseInt(document.getElementById('quantidade').value) || 0;
    const vendaEl = document.getElementById('venda');
    const venda = parseFloat(vendaEl.dataset.valor || vendaEl.value) || 0;
    
    produtos.push({
        id: Date.now(),
        codigo: gerarCodigo(),
        nome: document.getElementById('nome').value,
        quantidade: quantidade,
        quantidadeVendida: 0,
        custo: custo,
        porcentagem: porcentagem,
        venda: venda,
        data: new Date().toLocaleDateString()
    });
    
    salvarDados();
    alert('Produto cadastrado!');
    limparFormulario();
    carregarEstoqueDesktop();
}

function carregarEstoqueDesktop(filtro) {
    const tbody = document.getElementById('listaEstoque');
    if (!tbody) return;
    
    let filtrados = produtos;
    if (filtro === 'disponivel') filtrados = produtos.filter(p => p.quantidade > p.quantidadeVendida);
    else if (filtro === 'vendido') filtrados = produtos.filter(p => p.quantidadeVendida > 0);
    
    if (!filtrados.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#999;">Nenhum produto</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtrados.map(p => {
        const disp = p.quantidade - (p.quantidadeVendida || 0);
        let status = 'Disponivel', cls = 'status-disponivel';
        if (disp === 0) { status = 'Vendido'; cls = 'status-vendido'; }
        else if (p.quantidadeVendida > 0) { status = 'Vendido'; cls = 'status-vendido'; }
        
        return `<tr><td><strong>${p.codigo}</strong></td><td>${p.nome}</td><td>${p.quantidade}</td><td>${p.quantidadeVendida||0}</td><td>${formatarValor(p.custo)}</td><td>${formatarValor(p.venda)}</td><td><span class="status ${cls}">${status}</span></td><td><button class="btn btn-danger" onclick="excluirProduto(${p.id})"><i class="fas fa-trash"></i></button></td></tr>`;
    }).join('');
}

function filtrarEstoque(filtro, event) {
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.btn-filter[onclick*="${filtro}"]`);
    if (btn) btn.classList.add('active');
    carregarEstoqueDesktop(filtro);
}

function excluirProduto(id) {
    if (!confirm('Excluir produto?')) return;
    produtos = produtos.filter(p => p.id !== id);
    salvarDados();
    carregarEstoqueDesktop();
}

function limparFormulario() {
    document.getElementById('produtoForm').reset();
    document.getElementById('venda').value = '';
}

function carregarSelectProdutosDesktop() {
    const select = document.getElementById('produtoVenda');
    if (!select) return;
    const disponiveis = produtos.filter(p => p.quantidade > (p.quantidadeVendida || 0));
    select.innerHTML = '<option value="">Escolha um produto</option>' + disponiveis.map(p => `<option value="${p.id}" data-custo="${p.custo}" data-venda="${p.venda}">${p.codigo} - ${p.nome} (Disp: ${p.quantidade-(p.quantidadeVendida||0)})</option>`).join('');
}

function calcularVenda() {
    const select = document.getElementById('produtoVenda');
    const qtd = parseInt(document.getElementById('quantidadeVenda').value) || 0;
    if (!select.value || qtd <= 0) return;
    const opt = select.options[select.selectedIndex];
    const vu = parseFloat(opt.dataset.venda);
    const cu = parseFloat(opt.dataset.custo);
    document.getElementById('precoVenda').value = formatarValor(vu);
    document.getElementById('totalVenda').value = formatarValor(vu*qtd);
    document.getElementById('lucroVenda').value = formatarValor(vu-cu);
    document.getElementById('lucroTotalVenda').value = formatarValor((vu-cu)*qtd);
}

function registrarVendaDesktop(e) {
    e.preventDefault();
    const produtoId = parseInt(document.getElementById('produtoVenda').value);
    const qtd = parseInt(document.getElementById('quantidadeVenda').value);
    if (!produtoId || !qtd) { alert('Preencha todos os campos'); return; }
    
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) { alert('Produto nao encontrado'); return; }
    
    const disp = produto.quantidade - (produto.quantidadeVendida || 0);
    if (qtd > disp) { alert(`Apenas ${disp} disponiveis`); return; }
    
    produto.quantidadeVendida = (produto.quantidadeVendida || 0) + qtd;
    vendas.push({
        id: Date.now(), data: new Date().toLocaleDateString(),
        produtoId: produto.id, codigo: produto.codigo, nome: produto.nome,
        quantidade: qtd, vendaUnit: produto.venda,
        total: produto.venda * qtd, lucro: (produto.venda - produto.custo) * qtd
    });
    
    salvarDados();
    alert('Venda registrada!');
    document.getElementById('vendaForm').reset();
    ['precoVenda','totalVenda','lucroVenda','lucroTotalVenda'].forEach(id => document.getElementById(id).value = '');
    carregarVendasDesktop();
    carregarSelectProdutosDesktop();
}

function carregarVendasDesktop() {
    const tbody = document.getElementById('listaVendas');
    if (!tbody) return;
    if (!vendas.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#999;">Nenhuma venda</td></tr>';
        return;
    }
    tbody.innerHTML = vendas.slice().reverse().map(v => `<tr><td>${v.data}</td><td><strong>${v.codigo}</strong></td><td>${v.nome}</td><td>${v.quantidade}</td><td>${formatarValor(v.vendaUnit)}</td><td>${formatarValor(v.total)}</td><td><strong style="color:#27ae60;">${formatarValor(v.lucro)}</strong></td></tr>`).join('');
}

function atualizarRelatorioDesktop() {
    let ti = 0, tv = 0, lr = 0, ve = 0;
    produtos.forEach(p => {
        const qv = p.quantidadeVendida || 0;
        const qe = p.quantidade - qv;
        ti += p.custo * p.quantidade;
        tv += p.venda * qv;
        lr += (p.venda - p.custo) * qv;
        ve += p.custo * qe;
    });
    const els = ['totalInvestido','totalVendido','totalLucro','totalEstoque'];
    const vals = [ti,tv,lr,ve];
    els.forEach((id,i) => { const el = document.getElementById(id); if(el) el.textContent = formatarValor(vals[i]); });
}

// ==================== MOBILE ====================
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
    window.scrollTo({top:0,behavior:'smooth'});
}

function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (modalId === 'modal-vender') carregarSelectProdutosMobile();
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
    if (e.target.classList.contains('modal')) fecharModal(e.target.id);
};

function atualizarDashboard() {
    const tp = produtos.length;
    const hoje = new Date().toLocaleDateString();
    const vh = vendas.filter(v => v.data === hoje).reduce((s,v) => s+v.quantidade, 0);
    let lt = 0, inv = 0;
    produtos.forEach(p => { const qv = p.quantidadeVendida||0; inv += p.custo*p.quantidade; lt += (p.venda-p.custo)*qv; });
    
    const ids = ['dashTotalProdutos','dashTotalVendas','dashLucroTotal','dashInvestido'];
    const vals = [tp,vh,formatarValor(lt),formatarValor(inv)];
    ids.forEach((id,i) => { const el = document.getElementById(id); if(el) el.textContent = vals[i]; });
}

function calcularPrecoVendaMobile() {
    const custo = parseFloat(document.getElementById('custoProduto').value) || 0;
    const margem = parseFloat(document.getElementById('margemProduto').value) || 0;
    const valorVenda = custo + (custo*margem/100);
    const vendaEl = document.getElementById('precoVendaProduto');
    vendaEl.dataset.valor = valorVenda.toFixed(2);
    vendaEl.value = formatarValor(valorVenda);
}

function cadastrarProdutoMobile(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeProduto').value.trim();
    const qtd = parseInt(document.getElementById('qtdProduto').value) || 0;
    const custo = parseFloat(document.getElementById('custoProduto').value) || 0;
    const margem = parseFloat(document.getElementById('margemProduto').value) || 0;
    const vendaEl = document.getElementById('precoVendaProduto');
    const venda = parseFloat(vendaEl.dataset.valor || vendaEl.value) || 0;
    
    if (!nome || qtd <= 0 || custo <= 0) {
        mostrarToast('Preencha todos os campos');
        return;
    }
    
    produtos.push({
        id: Date.now(), codigo: gerarCodigo(), nome, quantidade: qtd,
        quantidadeVendida: 0, custo, margem,
        venda: venda, data: new Date().toLocaleDateString()
    });
    
    salvarDados();
    fecharModal('modal-cadastrar');
    mostrarToast('Produto cadastrado!');
    atualizarDashboard();
    carregarEstoqueMobile();
}

let filtroAtual = 'todos', buscaAtual = '';

function carregarEstoqueMobile() {
    const lista = document.getElementById('listaEstoqueMobile');
    if (!lista) return;
    
    let f = produtos;
    if (buscaAtual) f = f.filter(p => p.nome.toLowerCase().includes(buscaAtual.toLowerCase()) || p.codigo.toLowerCase().includes(buscaAtual.toLowerCase()));
    if (filtroAtual === 'disponivel') f = f.filter(p => p.quantidade > (p.quantidadeVendida||0));
    else if (filtroAtual === 'vendido') f = f.filter(p => (p.quantidadeVendida||0) > 0);
    
    if (!f.length) {
        lista.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Nenhum produto</p></div>';
        return;
    }
    
    lista.innerHTML = f.map(p => {
        const disp = p.quantidade - (p.quantidadeVendida||0);
        const pct = Math.round((disp/p.quantidade)*100);
        let st = 'disponivel', txt = 'Disponivel';
        if (disp===0) { st='vendido'; txt='Vendido'; }
        else if (p.quantidadeVendida>0) { st='vendido'; txt='Vendido'; }
        
        return `<div class="product-card" onclick="verDetalhesProduto(${p.id})">
            <div class="product-img"><i class="fas fa-tshirt"></i></div>
            <div class="product-info"><div class="product-name">${p.nome}</div><div class="product-meta"><span class="status-badge status-${st}">${txt}</span><span>${p.codigo}</span></div></div>
            <div class="product-price"><div class="price">${formatarValor(p.venda)}</div><div class="stock">${disp}/${p.quantidade} disp.</div></div>
        </div>`;
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
    const p = produtos.find(x => x.id === id);
    if (!p) return;
    const disp = p.quantidade - (p.quantidadeVendida||0);
    if (confirm(`${p.nome}\nCodigo: ${p.codigo}\nQtd: ${p.quantidade}\nVendido: ${p.quantidadeVendida||0}\nDisp: ${disp}\nCusto: ${formatarValor(p.custo)}\nVenda: ${formatarValor(p.venda)}\n\nExcluir?`)) {
        produtos = produtos.filter(x => x.id !== id);
        salvarDados();
        mostrarToast('Excluido!');
        carregarEstoqueMobile();
        atualizarDashboard();
    }
}

function carregarSelectProdutosMobile() {
    const select = document.getElementById('selectProduto');
    if (!select) return;
    const disp = produtos.filter(p => p.quantidade > (p.quantidadeVendida||0));
    select.innerHTML = '<option value="">Selecione</option>' + disp.map(p => {
        const d = p.quantidade - (p.quantidadeVendida||0);
        return `<option value="${p.id}" data-custo="${p.custo}" data-venda="${p.venda}" data-disp="${d}">${p.nome} (${d} disp.)</option>`;
    }).join('');
}

function atualizarInfoVendaMobile() {
    const select = document.getElementById('selectProduto');
    const qtd = parseInt(document.getElementById('qtdVenda').value) || 0;
    if (!select.value) {
        document.getElementById('dispVenda').value = '-';
        ['precoUnitVenda','totalVenda','lucroVenda'].forEach(id => document.getElementById(id).textContent = formatarValor(0));
        return;
    }
    const opt = select.options[select.selectedIndex];
    const vu = parseFloat(opt.dataset.venda);
    const cu = parseFloat(opt.dataset.custo);
    const disp = parseInt(opt.dataset.disp);
    document.getElementById('dispVenda').value = disp;
    document.getElementById('precoUnitVenda').textContent = formatarValor(vu);
    document.getElementById('totalVenda').textContent = formatarValor(vu*qtd);
    document.getElementById('lucroVenda').textContent = formatarValor((vu-cu)*qtd);
}

function registrarVendaMobile(e) {
    e.preventDefault();
    const pid = parseInt(document.getElementById('selectProduto').value);
    const qtd = parseInt(document.getElementById('qtdVenda').value);
    if (!pid || !qtd) { mostrarToast('Preencha todos os campos'); return; }
    
    const p = produtos.find(x => x.id === pid);
    if (!p) { mostrarToast('Produto nao encontrado'); return; }
    
    const disp = p.quantidade - (p.quantidadeVendida||0);
    if (qtd > disp) { mostrarToast(`Apenas ${disp} disponiveis`); return; }
    
    p.quantidadeVendida = (p.quantidadeVendida||0) + qtd;
    vendas.push({
        id: Date.now(), data: new Date().toLocaleDateString(),
        produtoId: p.id, codigo: p.codigo, nome: p.nome,
        quantidade: qtd, vendaUnit: p.venda,
        total: p.venda*qtd, lucro: (p.venda-p.custo)*qtd
    });
    
    salvarDados();
    fecharModal('modal-vender');
    mostrarToast('Venda registrada!');
    atualizarDashboard();
    carregarVendasMobile();
    carregarEstoqueMobile();
}

function carregarVendasMobile() {
    const lista = document.getElementById('listaVendasMobile');
    if (!lista) return;
    
    let tv = 0, tl = 0;
    vendas.forEach(v => { tv += v.total; tl += v.lucro; });
    
    const elTotal = document.getElementById('vendasTotal');
    const elLucro = document.getElementById('vendasLucro');
    if (elTotal) elTotal.textContent = formatarValor(tv);
    if (elLucro) elLucro.textContent = formatarValor(tl);
    
    if (!vendas.length) {
        lista.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>Nenhuma venda</p></div>';
        return;
    }
    
    lista.innerHTML = vendas.slice().reverse().map(v => `<div class="sale-card">
        <div class="product-img" style="width:40px;height:40px;font-size:1rem;"><i class="fas fa-shopping-bag"></i></div>
        <div class="sale-info"><div class="sale-product">${v.nome}</div><div class="sale-detail">${v.data} · ${v.quantidade} un · ${v.codigo}</div></div>
        <div class="sale-value"><div class="value">${formatarValor(v.total)}</div><div class="profit">+${formatarValor(v.lucro)}</div></div>
    </div>`).join('');
}

function atualizarRelatorioMobile() {
    let ti = 0, tv = 0, lr = 0, ve = 0;
    produtos.forEach(p => {
        const qv = p.quantidadeVendida||0;
        const qe = p.quantidade - qv;
        ti += p.custo * p.quantidade;
        tv += p.venda * qv;
        lr += (p.venda - p.custo) * qv;
        ve += p.custo * qe;
    });
    
    const ids = ['relInvestido','relVendido','relLucro','relEstoque'];
    const vals = [ti,tv,lr,ve];
    ids.forEach((id,i) => { const el = document.getElementById(id); if(el) el.textContent = formatarValor(vals[i]); });
    
    const roi = ti > 0 ? Math.min((tv/ti)*100, 100) : 0;
    const pf = document.getElementById('progressROI');
    const tr = document.getElementById('textROI');
    if (pf) setTimeout(() => pf.style.width = roi+'%', 100);
    if (tr) tr.textContent = roi.toFixed(1)+'% do investimento retornado';
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
    configurarLogin();
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
    
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        dateEl.textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1);
    }
    
    const custoInput = document.getElementById('custo');
    const porcentagemInput = document.getElementById('porcentagem');
    [custoInput, porcentagemInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calcularValores);
            input.addEventListener('change', calcularValores);
            input.addEventListener('blur', calcularValores);
        }
    });
    calcularValores();
    
    const produtoForm = document.getElementById('produtoForm');
    if (produtoForm) produtoForm.addEventListener('submit', adicionarProduto);
    
    const produtoVenda = document.getElementById('produtoVenda');
    const qtdVenda = document.getElementById('quantidadeVenda');
    if (produtoVenda) produtoVenda.addEventListener('change', calcularVenda);
    if (qtdVenda) qtdVenda.addEventListener('input', calcularVenda);
    
    const vendaForm = document.getElementById('vendaForm');
    if (vendaForm) vendaForm.addEventListener('submit', registrarVendaDesktop);
    
    window.addEventListener('online', sincronizarPendencias);
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) sincronizarPendencias();
    });
});