// public/estoque.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores do DOM ---
    const tabelaCorpo = document.getElementById('tabela-estoque-corpo');
    const inputBusca = document.getElementById('input-busca-estoque');
    const userNameSpan = document.getElementById('user-name');
    
    // Modal
    const modal = document.getElementById('modal-movimentacao');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const btnCancelar = document.getElementById('btn-cancelar');
    const formMovimentacao = document.getElementById('form-movimentacao');
    const modalProdutoNome = document.getElementById('modal-produto-nome');
    const inputProdutoId = document.getElementById('mov_id_produto');
    const inputQuantidade = document.getElementById('quantidade');

    let listaProdutosCache = []; // Armazena a lista completa para o filtro

    // --- Funções ---

    // 1. Buscar produtos (da mesma API da Etapa 6)
    const carregarEstoque = async () => {
        tabelaCorpo.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
        
        try {
            // Usamos a mesma API de produtos, ela já traz o estoque
            const response = await fetch('/api/produtos'); 
            
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            if (!response.ok) {
                throw new Error('Falha ao buscar estoque.');
            }
            
            const produtos = await response.json();
            // A API já ordena por nome (ORDER BY p.nome ASC)
            listaProdutosCache = produtos;
            renderizarTabela(produtos);

        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
            tabelaCorpo.innerHTML = `<tr><td colspan="5">Erro ao carregar estoque.</td></tr>`;
        }
    };

    // 2. Renderizar a Tabela
    const renderizarTabela = (produtos) => {
        tabelaCorpo.innerHTML = ''; 

        if (produtos.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="5">Nenhum produto encontrado.</td></tr>';
            return;
        }

        produtos.forEach(produto => {
            const estoqueBaixo = produto.quantidade_atual <= produto.estoque_minimo;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Produto">${produto.nome} (${produto.marca || 'N/A'})</td>
                <td data-label="Estoque Atual"><strong>${produto.quantidade_atual}</strong></td>
                <td data-label="Estoque Mínimo">${produto.estoque_minimo}</td>
                <td data-label="Status" class="${estoqueBaixo ? 'status-alerta' : 'status-ok'}">
                    ${estoqueBaixo ? 'ESTOQUE BAIXO' : 'OK'}
                </td>
                <td data-label="Ações">
                    <button class="btn-acao btn-primary" data-id="${produto.id_produto}" data-nome="${produto.nome}">
                        Movimentar
                    </button>
                </td>
            `;
            
            tr.querySelector('.btn-primary').addEventListener('click', () => 
                abrirModalMovimentacao(produto)
            );
            
            tabelaCorpo.appendChild(tr);
        });
    };

    // 3. Filtrar Tabela (localmente, sem API)
    const filtrarEstoque = () => {
        const termo = inputBusca.value.toLowerCase();
        if (!termo) {
            renderizarTabela(listaProdutosCache); // Mostra todos
            return;
        }
        
        const filtrados = listaProdutosCache.filter(p => 
            p.nome.toLowerCase().includes(termo) || 
            (p.marca && p.marca.toLowerCase().includes(termo))
        );
        renderizarTabela(filtrados);
    };

    // 4. Abrir Modal
    const abrirModalMovimentacao = (produto) => {
        formMovimentacao.reset();
        modalProdutoNome.textContent = produto.nome;
        inputProdutoId.value = produto.id_produto;
        document.getElementById('tipo-entrada').checked = true; // Padrão
        modal.style.display = 'block';
    };

    const fecharModal = () => {
        modal.style.display = 'none';
    };

    // 5. Enviar Movimentação
    const registrarMovimentacao = async (evento) => {
        evento.preventDefault();
        
        const id_produto = parseInt(inputProdutoId.value, 10);
        const tipo = formMovimentacao.querySelector('input[name="tipo"]:checked').value;
        const quantidade = parseInt(inputQuantidade.value, 10);

        if (quantidade <= 0) {
            alert('A quantidade deve ser maior que zero.');
            return;
        }

        try {
            const response = await fetch('/api/estoque/movimentar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_produto, tipo, quantidade })
            });

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.message || 'Falha ao registrar');
            }

            alert('Movimentação registrada com sucesso!');
            fecharModal();
            carregarEstoque(); // Atualiza a lista inteira

        } catch (error) {
            console.error('Erro ao movimentar:', error);
            alert(`Erro: ${error.message}`);
        }
    };

    // --- Event Listeners ---
    inputBusca.addEventListener('keyup', filtrarEstoque);
    
    // Modal
    modalCloseBtn.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) fecharModal();
    });
    formMovimentacao.addEventListener('submit', registrarMovimentacao);

    // Carregar nome do usuário
    fetch('/api/user/me')
        .then(res => res.json())
        .then(user => { if (user.nome) userNameSpan.textContent = user.nome; })
        .catch(() => window.location.href = '/login.html');

    // Carregamento inicial
    carregarEstoque();
});