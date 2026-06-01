# 🛒 OmniMarket — E-commerce Full-Stack

> Desenvolvido como projeto acadêmico completo.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

Plataforma de e-commerce completa com autenticação, carrinho de compras, checkout, gestão de anúncios e identidade visual moderna. Toda a infraestrutura (Frontend, Backend e Banco de Dados) é orquestrada de forma simplificada utilizando **Docker Compose**.

---

## 📦 Estrutura do Projeto

```text
omnimarket/
├── docker-compose.yml        ← Orquestra todos os serviços
├── mysql/
│   └── init.sql              ← Schema + dados iniciais (seed)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js         ← Entry point Express
│       ├── config/
│       │   └── database.js   ← Pool de conexão MySQL
│       ├── middleware/
│       │   └── auth.js       ← Middleware JWT
│       └── routes/
│           ├── auth.js       ← Login / Registro
│           ├── produtos.js   ← CRUD de produtos + favoritar
│           ├── carrinho.js   ← Carrinho de compras
│           ├── pedidos.js    ← Checkout + histórico
│           ├── categorias.js ← Listagem de categorias
│           └── usuarios.js   ← Perfil + favoritos
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.js            ← Rotas SPA
        ├── context/          ← AuthContext, CarrinhoContext
        ├── services/
        │   └── api.js        ← Axios com interceptor JWT
        ├── components/
        │   ├── Navbar.js
        │   └── ProdutoCard.js
        └── pages/
            ├── Home.js
            ├── Produtos.js   ← Listagem + filtros
            ├── ProdutoDetalhe.js
            ├── Login.js / Registro.js
            ├── Carrinho.js
            ├── Pedidos.js
            ├── Perfil.js
            └── NovoAnuncio.js

```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.

### 1. Clone e acesse a pasta do projeto

```bash
git clone [https://github.com/SeuUsuario/OminiMarket-Projeto-Docker.git](https://github.com/SeuUsuario/OminiMarket-Projeto-Docker.git)
cd OminiMarket-Projeto-Docker-main

```

*(Nota: dependendo de como você nomeou a pasta localmente, o comando `cd` pode variar).*

### 2. Suba a infraestrutura com um único comando

```bash
docker compose up --build

```

> 💡 **Na primeira execução**, o Docker irá:
> 1. Baixar as imagens oficias do MySQL 8.0 e Node 18.
> 2. Instalar as dependências (`node_modules`) de ambos os serviços.
> 3. Criar o banco de dados e popular as tabelas iniciais via `init.sql`.
> 
> 
> Aguarde até ver a mensagem `✅ MySQL conectado com sucesso!` no terminal do backend.

### 3. Acesse no navegador

| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001/api |
| MySQL | localhost:3306 |

---

## 👤 Usuários de Teste (Mock)

A base de dados já vem populada com contas para facilitar os testes.
**Senha padrão para todos:** `123456`

| Nome | E-mail |
| --- | --- |
| João Silva | joao@email.com |
| Maria Souza | maria@email.com |
| Carlos Oliveira | carlos@email.com |
| Adminstrador Sistema | admin@ml.com |

---

## 🔌 Endpoints da API

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/registrar` | Cria nova conta |
| POST | `/api/auth/login` | Login → Gera JWT |

### Produtos

| Método | Rota | Auth? | Descrição |
| --- | --- | --- | --- |
| GET | `/api/produtos` | — | Listar e buscar |
| GET | `/api/produtos/:id` | — | Detalhes do produto |
| POST | `/api/produtos` | ✅ | Criar novo anúncio |
| PUT | `/api/produtos/:id` | ✅ | Editar anúncio |
| DELETE | `/api/produtos/:id` | ✅ | Remover anúncio |
| POST | `/api/produtos/:id/favoritar` | ✅ | Adicionar a favoritos |
| DELETE | `/api/produtos/:id/favoritar` | ✅ | Remover de favoritos |

### Carrinho

| Método | Rota | Auth? | Descrição |
| --- | --- | --- | --- |
| GET | `/api/carrinho` | ✅ | Visualizar itens |
| POST | `/api/carrinho` | ✅ | Adicionar produto |
| PUT | `/api/carrinho/:id` | ✅ | Alterar quantidade |
| DELETE | `/api/carrinho/:id` | ✅ | Remover produto |
| DELETE | `/api/carrinho` | ✅ | Esvaziar carrinho |

### Pedidos & Usuários

| Método | Rota | Auth? | Descrição |
| --- | --- | --- | --- |
| POST | `/api/pedidos` | ✅ | Finalizar compra |
| GET | `/api/pedidos` | ✅ | Histórico do usuário |
| PATCH | `/api/pedidos/:id/status` | ✅ | Atualizar rastreio |
| GET | `/api/usuarios/perfil` | ✅ | Dados da conta |
| GET | `/api/usuarios/meus-produtos` | ✅ | Anúncios publicados |

---

## 🗃️ Banco de Dados Relacional

Principais tabelas do sistema (MySQL):

* **`usuarios`**: Gestão de contas e credenciais.
* **`enderecos`**: Logística e destinos de entrega.
* **`categorias`**: Árvore de navegação da vitrine.
* **`produtos` & `produto_imagens**`: Anúncios, preços, estoque e galeria.
* **`carrinho`**: Sessões de compras ativas.
* **`pedidos` & `pedido_itens**`: Histórico financeiro e logístico consolidado.
* **`favoritos` & `avaliacoes**`: Interação social e reputação.

---

## 🛑 Gerenciamento do Docker

Para desligar o sistema sem perder os dados do banco:

```bash
docker compose down

```

Para "resetar" o projeto inteiro (apagando os registros do banco de dados local):

```bash
docker compose down -v

```

---

## 🏗️ Arquitetura do Sistema

```text
┌──────────────────────────────────────────┐
│          Docker Compose Network          │
│                                          │
│  ┌──────────┐    ┌──────────────────┐    │
│  │ Frontend │────▶      Backend     │    │
│  │  React   │    │  Node + Express  │    │
│  │  :3000   │    │      :3001       │    │
│  └──────────┘    └────────┬─────────┘    │
│                           │              │
│                  ┌────────▼─────────┐    │
│                  │     MySQL 8.0    │    │
│                  │       :3306      │    │
│                  └──────────────────┘    │
└──────────────────────────────────────────┘

```

> **Aviso:** Este é um projeto acadêmico com foco no aprendizado da stack e integração de containers. Não recomendado para uso comercial em ambiente de produção sem implementações extras de segurança.
