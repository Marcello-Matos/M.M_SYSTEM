const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('./estoque.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
    }
});

// Criar tabela de produtos se nao existir
db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        custo REAL NOT NULL,
        porcentagem REAL NOT NULL,
        venda REAL NOT NULL,
        lucro REAL NOT NULL,
        lucro_total REAL NOT NULL,
        investimento REAL NOT NULL,
        lucro_liquido REAL NOT NULL,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('Erro ao criar tabela:', err);
    } else {
        console.log('✅ Tabela de produtos criada/verificada');
    }
});

// Gerar codigo automatico
function gerarCodigo() {
    const prefixo = 'RP';
    const numero = Math.floor(Math.random() * 9000) + 1000;
    return prefixo + numero;
}

// ROTAS DA API

// Listar todos os produtos
app.get('/api/produtos', (req, res) => {
    db.all('SELECT * FROM produtos ORDER BY data_cadastro DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Buscar produto por ID
app.get('/api/produtos/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM produtos WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Produto nao encontrado' });
            return;
        }
        res.json(row);
    });
});

// Criar novo produto
app.post('/api/produtos', (req, res) => {
    const { nome, quantidade, custo, porcentagem } = req.body;
    
    // Calcular valores
    const venda = parseFloat(custo) + (parseFloat(custo) * parseFloat(porcentagem) / 100);
    const lucro = venda - parseFloat(custo);
    const lucro_total = lucro * parseInt(quantidade);
    const investimento = parseFloat(custo) * parseInt(quantidade);
    const lucro_liquido = lucro_total;
    const codigo = gerarCodigo();
    
    const sql = `INSERT INTO produtos 
        (codigo, nome, quantidade, custo, porcentagem, venda, lucro, lucro_total, investimento, lucro_liquido) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [codigo, nome, quantidade, custo, porcentagem, venda, lucro, lucro_total, investimento, lucro_liquido], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            codigo,
            nome,
            quantidade,
            custo,
            porcentagem,
            venda,
            lucro,
            lucro_total,
            investimento,
            lucro_liquido
        });
    });
});

// Atualizar produto
app.put('/api/produtos/:id', (req, res) => {
    const id = req.params.id;
    const { nome, quantidade, custo, porcentagem } = req.body;
    
    // Recalcular valores
    const venda = parseFloat(custo) + (parseFloat(custo) * parseFloat(porcentagem) / 100);
    const lucro = venda - parseFloat(custo);
    const lucro_total = lucro * parseInt(quantidade);
    const investimento = parseFloat(custo) * parseInt(quantidade);
    const lucro_liquido = lucro_total;
    
    const sql = `UPDATE produtos SET 
        nome = ?, quantidade = ?, custo = ?, porcentagem = ?, 
        venda = ?, lucro = ?, lucro_total = ?, investimento = ?, lucro_liquido = ?
        WHERE id = ?`;
    
    db.run(sql, [nome, quantidade, custo, porcentagem, venda, lucro, lucro_total, investimento, lucro_liquido, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Produto nao encontrado' });
            return;
        }
        res.json({ message: 'Produto atualizado com sucesso' });
    });
});

// Excluir produto
app.delete('/api/produtos/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM produtos WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Produto nao encontrado' });
            return;
        }
        res.json({ message: 'Produto excluido com sucesso' });
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Fechar banco de dados ao encerrar
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('🔌 Conexao com banco de dados fechada');
        process.exit(0);
    });
});
