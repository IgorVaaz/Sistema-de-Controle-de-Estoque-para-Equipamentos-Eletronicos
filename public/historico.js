// public/historico.js

document.addEventListener('DOMContentLoaded', () => {

    const tabelaCorpo = document.getElementById('tabela-historico-corpo');
    const userNameSpan = document.getElementById('user-name');

    // Formata a data (ex: 2024-10-30T14:30:00 -> 30/10/2024 14:30)
    const formatarData = (dataISO) => {
        const data = new Date(dataISO);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 1. Carregar Histórico
    const carregarHistorico = async () => {
        try {
            const response = await fetch('/api/estoque/historico');
            
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            if (!response.ok) {
                throw new Error('Falha ao buscar histórico.');
            }
            
            const historico = await response.json();
            renderizarTabela(historico);

        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            tabelaCorpo.innerHTML = `<tr><td colspan="5">Erro ao carregar histórico.</td></tr>`;
        }
    };

    // 2. Renderizar Tabela
    const renderizarTabela = (historico) => {
        tabelaCorpo.innerHTML = '';
        if (historico.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="5">Nenhuma movimentação registrada.</td></tr>';
            return;
        }

        historico.forEach(mov => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Data">${formatarData(mov.data_movimentacao)}</td>
                <td data-label="Produto">${mov.nome_produto}</td>
                <td data-label="Responsável">${mov.nome_usuario}</td>
                <td data-label="Tipo" style="color: ${mov.tipo === 'Entrada' ? 'green' : 'red'};">
                    ${mov.tipo}
                </td>
                <td data-label="Quantidade">${mov.quantidade}</td>
            `;
            tabelaCorpo.appendChild(tr);
        });
    };

    // Carregar nome do usuário
    fetch('/api/user/me')
        .then(res => res.json())
        .then(user => { if (user.nome) userNameSpan.textContent = user.nome; })
        .catch(() => window.location.href = '/login.html');

    // Carregamento inicial
    carregarHistorico();
});