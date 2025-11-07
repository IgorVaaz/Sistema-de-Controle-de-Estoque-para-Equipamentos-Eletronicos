// server.js (VERSÃO CORRIGIDA)

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path'); // Essencial

// Importar os módulos de rota
const { router: authRouter, checkAuth } = require('./routes/auth');
const produtosRouter = require('./routes/produtos');
const estoqueRouter = require('./routes/estoque');

const app = express();
const PORT = 3000;

// --- Configuração (Middleware Global) ---
app.use(session({
    secret: 'seu-segredo-muito-secreto-aqui', // Mantenha seu segredo
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Para dev
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- 1. Servir TODOS os arquivos estáticos da pasta 'public' ---
// Isso torna /login.html, /style.css, /produtos.js, etc. publicamente disponíveis
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. Rotas de API ---
// POST /login, POST /cadastro, GET /logout, GET /api/user/me
app.use(authRouter); 

// GET, POST, PUT, DELETE /api/produtos (Protegido por checkAuth)
app.use(checkAuth, produtosRouter); 
app.use(checkAuth, estoqueRouter);

// --- 3. Rotas de PÁGINAS HTML (Proteção) ---

// Rota raiz: Onde tudo começa
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/index.html'); // Logado? Vá para o dashboard
    } else {
        res.redirect('/login.html'); // Não logado? Vá para o login
    }
});

/*
 * Esta é a correção principal:
 * Protegemos o ACESSO às páginas HTML específicas.
 * O `express.static` acima serve os arquivos, mas estas rotas `app.get`
 * garantem que o usuário esteja logado (checkAuth) ANTES de o arquivo ser enviado.
 */

// Proteção da Página Principal
app.get('/index.html', checkAuth, (req, res) => {
    // Se passou pelo checkAuth, apenas envie o arquivo
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Proteção da Página de Produtos
app.get('/produtos.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/produtos.html'));
});

// Proteção da Página de Estoque
app.get('/estoque.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/estoque.html'));
});

// Proteção da Página de Histórico
app.get('/historico.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/historico.html'));
});

// --- Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});