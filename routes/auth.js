// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db'); // Nosso pool de conexão

// Middleware para verificar se o usuário está logado
function checkAuth(req, res, next) {
    if (req.session.userId) {
        // Se tem sessão, continue para a rota
        next();
    } else {
        // Se não tem sessão, redirecione para o login
        res.redirect('/login.html');
    }
}

const router = express.Router();

// ROTA DE LOGIN (POST)
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.send('Email e senha são obrigatórios.'); // Tratamento de erro simples
    }

    try {
        // 1. Buscar o usuário no banco pelo email
        const [rows] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            // Usuário não encontrado
            console.log('Tentativa de login falhou: Email não encontrado.');
            return res.redirect('/login.html?error=1'); // Redireciona de volta ao login
        }

        const usuario = rows[0];

        // 2. Comparar a senha enviada com o hash salvo no banco
        // O hash de 'admin@123' que inserimos no SQL é: $2b$10$f/9e.E.9.gP3K2YjZ.fQZO.R.L.5.f.Z.9.E.2.9.f/K.f.E.1.E
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (senhaCorreta) {
            // 3. Senha correta! Criar a sessão
            req.session.userId = usuario.id_usuario;
            req.session.userName = usuario.nome;
            
            // Redireciona para a página principal (Etapa 5)
            res.redirect('/index.html'); 
        } else {
            // Senha incorreta
            console.log('Tentativa de login falhou: Senha incorreta.');
            res.redirect('/login.html?error=1');
        }

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// ROTA DE CADASTRO (POST)
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.send('Todos os campos são obrigatórios.');
    }

    try {
        // Criptografar a senha antes de salvar
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // Inserir no banco
        await db.query('INSERT INTO Usuario (nome, email, senha_hash) VALUES (?, ?, ?)', 
            [nome, email, senhaHash]
        );

        console.log('Novo usuário cadastrado:', email);
        res.redirect('/login.html?success=1'); // Redireciona para o login

    } catch (error) {
        console.error('Erro no cadastro:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.send('Este email já está cadastrado.');
        } else {
            res.status(500).send('Erro interno do servidor.');
        }
    }
});

// ROTA DE LOGOUT (GET) - (Usaremos na Etapa 5)
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/index.html'); // Se der erro, volta pra tela principal
        }
        res.clearCookie('connect.sid'); // Limpa o cookie da sessão
        res.redirect('/login.html'); // Redireciona para o login
    });
});

// API para buscar dados do usuário logado
router.get('/api/user/me', checkAuth, (req, res) => {
    // checkAuth já garantiu que a sessão existe
    res.json({
        id: req.session.userId,
        nome: req.session.userName
    });
});

module.exports = { router, checkAuth };