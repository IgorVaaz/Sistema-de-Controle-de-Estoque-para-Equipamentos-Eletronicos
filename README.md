# 📦 Sistema de Controle de Estoque para Equipamentos Eletrônicos

![Status: Concluído](https://img.shields.io/badge/status-conclu%C3%ADdo-brightgreen)

Projeto acadêmico/portfólio de um sistema web completo para gerenciar um estoque de equipamentos eletrônicos. A aplicação substitui o controle manual em planilhas por uma plataforma automatizada, intuitiva e robusta, com backend em Node.js e frontend em HTML/CSS/JS.

O sistema cobre desde a autenticação de usuários até o registro detalhado de movimentações, alertas de estoque baixo e um CRUD completo de produtos com especificações técnicas.

---

## ✨ Funcionalidades Principais (Requisitos)

* **RF01 - Autenticação Segura:** Cadastro de novos usuários e login com verificação de senha (usando `bcrypt`).
* **RF02 - Gerenciamento de Produtos (CRUD):** Funcionalidade completa para Criar, Ler, Atualizar e Excluir produtos.
* **RF03 - Especificações Técnicas:** Formulário detalhado para cadastro de atributos como marca, modelo, processador, RAM, armazenamento, cor, tela, etc.
* **RF04 - Controle de Estoque:** Interface dedicada para registrar Entradas e Saídas de produtos.
* **RF05 - Estoque Mínimo:** Permite configurar um nível de estoque mínimo individual para cada produto.
* **RF06 - Alertas Visuais:** O sistema sinaliza visualmente (em vermelho) produtos que estão abaixo do estoque mínimo configurado.
* **RF07 & RF08 - Histórico e Rastreabilidade:** Tela de histórico detalhado que registra todas as movimentações (tipo, quantidade, produto), identificando o **usuário responsável** e a **data/hora** da operação.

---

## 🚀 Tecnologias Utilizadas (Tech Stack)

### Backend
* **Plataforma:** Node.js
* **Framework:** Express.js
* **Banco de Dados:** MySQL 8.0
* **Bibliotecas Principais:**
    * `mysql2`: Driver de conexão com o MySQL (com suporte a Promises).
    * `bcrypt`: Para hashing seguro e comparação de senhas.
    * `express-session`: Para gerenciamento de sessões de usuário (autenticação).
    * `body-parser`: Middleware para processar dados de formulários (`POST`).

### Frontend
* **Estrutura:** HTML5 Semântico
* **Estilização:** CSS3 (Flexbox, Grid, Modais)
* **Interatividade:** JavaScript (ES6+), com chamadas de API (via `fetch`) e manipulação de DOM.

---

## 🗃️ Modelagem do Banco de Dados

O banco de dados `saepdb` foi estruturado com quatro entidades principais para garantir integridade e performance:

1.  **`Usuario`**: Armazena os dados de login (nome, e-mail, senha_hash).
2.  **`Produto`**: Armazena todas as especificações técnicas (nome, marca, modelo, processador, ram, etc.).
3.  **`Estoque`**: Controla a `quantidade_atual` e o `estoque_minimo`. Possui um relacionamento 1:1 com `Produto`.
4.  **`Movimentacao`**: Registra o log de todas as entradas e saídas, servindo como histórico (relaciona-se com `Usuario` e `Produto`).

---

## 🏁 Como Executar o Projeto Localmente

Siga os passos abaixo para rodar a aplicação em seu ambiente de desenvolvimento.

### Pré-requisitos
* **Node.js** (v18 ou superior)
* **MySQL Server** (v8.0 ou superior)

### 1. Clonar o Repositório
```bash
git clone https://[URL-DO-SEU-REPOSITORIO-AQUI]/sistema-estoque.git
cd sistema-estoque

Resumindo:
1 - Abrir o projeto no vscode
2 - Copiar o arquivo saepdb.sql e rodar no SQL do Xampp
3 - Rodar aplicação no terminal do vscode com: 

	npm init -y
	npm install express mysql2 bcrypt express-session body-parser
	npm install

	node server.js

4 - Acessar http://localhost:3000

5 - Cadastrar usuário (cadastre-se)

6 - Efetuar login com email e senha cadastrada.
