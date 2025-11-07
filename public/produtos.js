// public/produtos.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Seletores do DOM ---
    const tabelaCorpo = document.getElementById('tabela-produtos-corpo');
    const inputBusca = document.getElementById('input-busca');
    const modal = document.getElementById('modal-produto');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const btnNovoProduto = document.getElementById('btn-novo-produto');
    const btnCancelar = document.getElementById('btn-cancelar');
    const formProduto = document.getElementById('form-produto');
    const userNameSpan = document.getElementById('user-name');

    // Campos do formulário
    const inputId = document.getElementById('produto_id');
    const inputNome = document.getElementById('nome');
    const inputMarca = document.getElementById('marca');
    const inputModelo = document.getElementById('modelo');
    const inputCor = document.getElementById('cor');
    const inputProcessador = document.getElementById('processador');
    const inputRam = document.getElementById('ram');
    const inputArmazenamento = document.getElementById('armazenamento');
    const inputTela = document.getElementById('tela');
    const inputSO = document.getElementById('sistema_operacional');
    const inputQtdAtual = document.getElementById('quantidade_atual');
    const inputEstoqueMinimo = document.getElementById('estoque_minimo');

    // Estado da aplicação
    let modoEdicao = false;
    let produtoEditandoId = null;

    // --- Funções de API (Fetch) ---

    // 1. Buscar e Renderizar Produtos
    const carregarProdutos = async (termoBusca = '') => {
        tabelaCorpo.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
        
        try {
            const url = `/api/produtos${termoBusca ? `?search=${termoBusca}` : ''}`;
            const response = await fetch(url);

            if (response.status === 401) { // Não autorizado (sessão expirou)
                window.location.href = '/login.html';
                return;
            }
            if (!response.ok) {
                throw new Error('Falha ao buscar produtos.');
            }
            
            const produtos = await response.json();
            renderizarTabela(produtos);

        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            tabelaCorpo.innerHTML = `<tr><td colspan="6">Erro ao carregar produtos.</td></tr>`;
        }
    };

    // 2. Renderizar a Tabela
    const renderizarTabela = (produtos) => {
        tabelaCorpo.innerHTML = ''; // Limpa a tabela

        if (produtos.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="6">Nenhum produto encontrado.</td></tr>';
            return;
        }

        produtos.forEach(produto => {
            const estoqueBaixo = produto.quantidade_atual < produto.estoque_minimo;
            
            // Agrupa especificações para a coluna
            const especificacoes = [
                produto.processador, produto.ram, produto.armazenamento, 
                produto.tela, produto.sistema_operacional, produto.cor
            ].filter(Boolean).join(' / '); // Filtra nulos/vazios

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Nome">${produto.nome}</td>
                <td data-label="Marca/Modelo">${produto.marca || 'N/A'} / ${produto.modelo || 'N/A'}</td>
                <td data-label="Especificações">${especificacoes || 'N/A'}</td>
                <td data-label="Estoque Atual" style="${estoqueBaixo ? 'color: red; font-weight: bold;' : ''}">
                    ${produto.quantidade_atual}
                </td>
                <td data-label="Estoque Mínimo">${produto.estoque_minimo}</td>
                <td data-label="Ações">
                    <button class="btn-acao btn-editar" data-id="${produto.id_produto}">Editar</button>
                    <button class="btn-acao btn-excluir" data-id="${produto.id_produto}">Excluir</button>
                </td>
            `;
            
            // Adiciona listeners aos botões da linha
            tr.querySelector('.btn-editar').addEventListener('click', () => abrirModalEdicao(produto));
            tr.querySelector('.btn-excluir').addEventListener('click', () => excluirProduto(produto.id_produto, produto.nome));
            
            tabelaCorpo.appendChild(tr);
        });
    };

    // 3. Salvar Produto (Criar ou Editar)
    const salvarProduto = async (evento) => {
        evento.preventDefault(); // Impede o recarregamento da página

        // Coletar dados do formulário
        const dadosProduto = {
            nome: inputNome.value,
            marca: inputMarca.value,
            modelo: inputModelo.value,
            cor: inputCor.value,
            processador: inputProcessador.value,
            ram: inputRam.value,
            armazenamento: inputArmazenamento.value,
            tela: inputTela.value,
            sistema_operacional: inputSO.value,
            estoque_minimo: parseInt(inputEstoqueMinimo.value, 10),
            // Qtd. inicial só é enviada na criação (se não estiver desabilitado)
            quantidade_atual: inputQtdAtual.disabled ? undefined : parseInt(inputQtdAtual.value, 10)
        };

        const url = modoEdicao ? `/api/produtos/${produtoEditandoId}` : '/api/produtos';
        const method = modoEdicao ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosProduto)
            });

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.message || `Erro ${response.status}`);
            }

            fecharModal();
            carregarProdutos(inputBusca.value); // Recarrega a tabela (mantendo a busca)
            alert(`Produto ${modoEdicao ? 'atualizado' : 'criado'} com sucesso!`);

        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert(`Falha ao salvar produto: ${error.message}`);
        }
    };

    // 4. Excluir Produto
    const excluirProduto = async (id, nome) => {
        if (!confirm(`Tem certeza que deseja excluir o produto "${nome}"?\nATENÇÃO: Todo o histórico de movimentação também será apagado.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.message || `Erro ${response.status}`);
            }

            alert('Produto excluído com sucesso.');
            carregarProdutos(inputBusca.value); // Recarrega a tabela

        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert(`Falha ao excluir produto: ${error.message}`);
        }
    };

    // --- Funções do Modal ---

    const abrirModalNovo = () => {
        modoEdicao = false;
        produtoEditandoId = null;
        modalTitulo.textContent = 'Novo Produto';
        formProduto.reset(); // Limpa o formulário
        
        // Na criação, permitimos definir a Qtd. Inicial
        inputQtdAtual.disabled = false;
        inputQtdAtual.value = 0;
        inputEstoqueMinimo.value = 1;
        
        modal.style.display = 'block';
    };

    const abrirModalEdicao = (produto) => {
        modoEdicao = true;
        produtoEditandoId = produto.id_produto;
        modalTitulo.textContent = `Editando: ${produto.nome}`;
        formProduto.reset(); // Limpa o formulário
        
        // Preenche o formulário com dados do produto
        inputId.value = produto.id_produto;
        inputNome.value = produto.nome;
        inputMarca.value = produto.marca;
        inputModelo.value = produto.modelo;
        inputCor.value = produto.cor;
        inputProcessador.value = produto.processador;
        inputRam.value = produto.ram;
        inputArmazenamento.value = produto.armazenamento;
        inputTela.value = produto.tela;
        inputSO.value = produto.sistema_operacional;
        
        // Na edição, o campo Qtd. Inicial é DESABILITADO.
        inputQtdAtual.value = produto.quantidade_atual; // Mostra o valor
        inputQtdAtual.disabled = true; // Mas desabilita

        inputEstoqueMinimo.value = produto.estoque_minimo;
        
        modal.style.display = 'block';
    };

    const fecharModal = () => {
        modal.style.display = 'none';
        formProduto.reset();
    };

    // --- Carregamento Inicial e Event Listeners ---

    // Busca (com "debounce" para não fazer API call a cada tecla)
    let debounceTimer;
    inputBusca.addEventListener('keyup', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            carregarProdutos(inputBusca.value);
        }, 300); // Espera 300ms
    });

    // Abrir/Fechar Modal
    btnNovoProduto.addEventListener('click', abrirModalNovo);
    modalCloseBtn.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) fecharModal();
    });

    // Submissão do Formulário
    formProduto.addEventListener('submit', salvarProduto);

    // Carregar nome do usuário (da Etapa 5)
    fetch('/api/user/me')
        .then(res => res.json())
        .then(user => {
            if (user.nome) userNameSpan.textContent = user.nome;
        })
        .catch(() => window.location.href = '/login.html'); // Falha? Volta ao login.

    // Carregamento inicial dos dados
    carregarProdutos();
});