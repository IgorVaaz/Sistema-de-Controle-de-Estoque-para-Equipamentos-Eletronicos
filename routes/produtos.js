// routes/produtos.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// -----------------------------------------------------------------
// ROTA 1: GET /api/produtos (Listar todos com busca e estoque)
// -----------------------------------------------------------------
router.get('/api/produtos', async (req, res) => {
    const { search } = req.query; // Pega o parâmetro ?search= da URL

    try {
        let query = `
            SELECT p.*, e.quantidade_atual, e.estoque_minimo 
            FROM Produto p
            LEFT JOIN Estoque e ON p.id_produto = e.id_produto
        `;

        const params = [];
        if (search) {
            query += ' WHERE p.nome LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ?';
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY p.nome ASC';

        const [produtos] = await db.query(query, params);
        res.json(produtos);

    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro interno ao buscar produtos.' });
    }
});

// -----------------------------------------------------------------
// ROTA 2: POST /api/produtos (Criar novo produto)
// -----------------------------------------------------------------
router.post('/api/produtos', async (req, res) => {
    const { 
        nome, marca, modelo, cor, processador, ram, 
        armazenamento, tela, sistema_operacional,
        quantidade_atual, estoque_minimo 
    } = req.body;

    if (!nome || estoque_minimo === undefined) {
        return res.status(400).json({ message: 'Nome e Estoque Mínimo são obrigatórios.' });
    }

    // Usamos uma transação para garantir que o Produto E o Estoque sejam criados
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Inserir o Produto
        const [resultProduto] = await connection.query(
            `INSERT INTO Produto (nome, marca, modelo, cor, processador, ram, armazenamento, tela, sistema_operacional)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome, marca, modelo, cor, processador, ram, armazenamento, tela, sistema_operacional]
        );

        const novoProdutoId = resultProduto.insertId;

        // 2. Inserir o Estoque
        const qtdAtual = quantidade_atual || 0;
        await connection.query(
            `INSERT INTO Estoque (id_produto, quantidade_atual, estoque_minimo)
             VALUES (?, ?, ?)`,
            [novoProdutoId, qtdAtual, estoque_minimo]
        );

        // 3. (Opcional) Registrar a movimentação inicial se houver estoque
        if (qtdAtual > 0) {
            await connection.query(
                `INSERT INTO Movimentacao (id_produto, id_usuario, tipo, quantidade)
                 VALUES (?, ?, 'Entrada', ?)`,
                [novoProdutoId, req.session.userId, qtdAtual] // Pega o usuário da sessão
            );
        }

        await connection.commit(); // Sucesso! Salva as alterações.
        
        // Retorna o produto recém-criado
        const [novoProduto] = await db.query(
            'SELECT p.*, e.quantidade_atual, e.estoque_minimo FROM Produto p JOIN Estoque e ON p.id_produto = e.id_produto WHERE p.id_produto = ?',
            [novoProdutoId]
        );
        res.status(201).json(novoProduto[0]);

    } catch (error) {
        await connection.rollback(); // Deu erro! Desfaz as alterações.
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ message: 'Erro interno ao criar produto.' });
    } finally {
        connection.release(); // Libera a conexão
    }
});

// -----------------------------------------------------------------
// ROTA 3: PUT /api/produtos/:id (Atualizar produto)
// -----------------------------------------------------------------
router.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        nome, marca, modelo, cor, processador, ram, 
        armazenamento, tela, sistema_operacional,
        estoque_minimo // Na edição, SÓ permitimos atualizar o estoque MÍNIMO.
                         // A quantidade atual será mudada na Etapa 7.
    } = req.body;

    if (!nome) {
        return res.status(400).json({ message: 'O campo "nome" é obrigatório.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Atualizar o Produto
        await connection.query(
            `UPDATE Produto SET nome = ?, marca = ?, modelo = ?, cor = ?, 
             processador = ?, ram = ?, armazenamento = ?, tela = ?, sistema_operacional = ?
             WHERE id_produto = ?`,
            [nome, marca, modelo, cor, processador, ram, armazenamento, tela, sistema_operacional, id]
        );

        // 2. Atualizar o Estoque (mínimo)
        if (estoque_minimo !== undefined) {
             await connection.query(
                'UPDATE Estoque SET estoque_minimo = ? WHERE id_produto = ?',
                [estoque_minimo, id]
             );
        }
        
        await connection.commit();
        
        // Retorna o produto atualizado
        const [produtoAtualizado] = await db.query(
            'SELECT p.*, e.quantidade_atual, e.estoque_minimo FROM Produto p JOIN Estoque e ON p.id_produto = e.id_produto WHERE p.id_produto = ?',
            [id]
        );
        res.json(produtoAtualizado[0]);

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro interno ao atualizar produto.' });
    } finally {
        connection.release();
    }
});

// -----------------------------------------------------------------
// ROTA 4: DELETE /api/produtos/:id (Excluir produto)
// -----------------------------------------------------------------
router.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // ATENÇÃO: A ordem é importante para as chaves estrangeiras.
        // 1. Deletar as Movimentações primeiro
        await connection.query('DELETE FROM Movimentacao WHERE id_produto = ?', [id]);
        
        // 2. Deletar o Estoque
        await connection.query('DELETE FROM Estoque WHERE id_produto = ?', [id]);

        // 3. Deletar o Produto
        const [result] = await connection.query('DELETE FROM Produto WHERE id_produto = ?', [id]);
        
        await connection.commit();

        if (result.affectedRows > 0) {
            res.json({ message: 'Produto excluído com sucesso.' });
        } else {
            res.status(404).json({ message: 'Produto não encontrado.' });
        }

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao excluir produto:', error);
        // Se for erro de FK (ex: ER_ROW_IS_REFERENCED_2)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Erro: Este produto possui referências e não pode ser excluído.' });
        }
        res.status(500).json({ message: 'Erro interno ao excluir produto.' });
    } finally {
        connection.release();
    }
});

module.exports = router;