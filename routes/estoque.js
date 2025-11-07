// routes/estoque.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// -----------------------------------------------------------------
// ROTA 1: POST /api/estoque/movimentar (Registrar Entrada ou Saída)
// -----------------------------------------------------------------
router.post('/api/estoque/movimentar', async (req, res) => {
    const { id_produto, tipo, quantidade } = req.body;
    const id_usuario = req.session.userId; // Usuário logado

    if (!id_produto || !tipo || !quantidade || quantidade <= 0) {
        return res.status(400).json({ message: 'Dados inválidos.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar estoque atual (e travar a linha para evitar concorrência)
        const [rows] = await connection.query(
            'SELECT quantidade_atual FROM Estoque WHERE id_produto = ? FOR UPDATE',
            [id_produto]
        );

        if (rows.length === 0) {
            throw new Error('Produto não encontrado no estoque.');
        }

        const estoqueAtual = rows[0].quantidade_atual;
        let novaQuantidade = estoqueAtual;

        // 2. Calcular nova quantidade
        if (tipo === 'Entrada') {
            novaQuantidade += quantidade;
        } else if (tipo === 'Saída') {
            if (estoqueAtual < quantidade) {
                throw new Error('Estoque insuficiente para a saída.');
            }
            novaQuantidade -= quantidade;
        } else {
            throw new Error('Tipo de movimentação inválido.');
        }

        // 3. Atualizar a tabela Estoque
        await connection.query(
            'UPDATE Estoque SET quantidade_atual = ? WHERE id_produto = ?',
            [novaQuantidade, id_produto]
        );

        // 4. Registrar a Movimentação (Histórico)
        await connection.query(
            'INSERT INTO Movimentacao (id_produto, id_usuario, tipo, quantidade) VALUES (?, ?, ?, ?)',
            [id_produto, id_usuario, tipo, quantidade]
        );

        await connection.commit(); // Sucesso!
        res.status(200).json({ message: 'Estoque atualizado com sucesso.', novaQuantidade });

    } catch (error) {
        await connection.rollback(); // Desfaz tudo
        console.error('Erro ao movimentar estoque:', error);
        res.status(400).json({ message: error.message || 'Erro ao processar movimentação.' });
    } finally {
        connection.release();
    }
});

// -----------------------------------------------------------------
// ROTA 2: GET /api/estoque/historico (Ver histórico de movimentações)
// -----------------------------------------------------------------
router.get('/api/estoque/historico', async (req, res) => {
    try {
        const query = `
            SELECT 
                m.id_movimentacao,
                m.data_movimentacao,
                m.tipo,
                m.quantidade,
                p.nome as nome_produto,
                u.nome as nome_usuario
            FROM Movimentacao m
            JOIN Produto p ON m.id_produto = p.id_produto
            JOIN Usuario u ON m.id_usuario = u.id_usuario
            ORDER BY m.data_movimentacao DESC
            LIMIT 100; -- Limita a 100 registros para performance
        `;
        
        const [historico] = await db.query(query);
        res.json(historico);

    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ message: 'Erro interno ao buscar histórico.' });
    }
});

module.exports = router;