-- ============================================================
-- MercadoLivre Clone - Script de Inicialização do Banco
-- ============================================================
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS mercadolivre CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mercadolivre;

-- -------------------------------------------------------
-- USUÁRIOS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha       VARCHAR(255) NOT NULL,
  cpf         VARCHAR(14)  UNIQUE,
  telefone    VARCHAR(20),
  avatar_url  VARCHAR(255),
  reputacao   DECIMAL(3,1) DEFAULT 5.0,
  is_admin    BOOLEAN DEFAULT FALSE,
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- ENDEREÇOS (Unificado e Atualizado)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS enderecos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  cep         VARCHAR(10)  NOT NULL,
  rua         VARCHAR(200) NOT NULL,
  numero      VARCHAR(20)  NOT NULL,
  complemento VARCHAR(100),
  bairro      VARCHAR(100) NOT NULL,
  cidade      VARCHAR(100) NOT NULL,
  estado      VARCHAR(2)   NOT NULL,
  principal   BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- CATEGORIAS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  icone       VARCHAR(50),
  categoria_pai_id INT,
  FOREIGN KEY (categoria_pai_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- PRODUTOS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  titulo        VARCHAR(255) NOT NULL,
  descricao     TEXT,
  preco         DECIMAL(12,2) NOT NULL,
  preco_original DECIMAL(12,2),
  estoque       INT NOT NULL DEFAULT 0,
  categoria_id  INT,
  vendedor_id   INT NOT NULL,
  condicao      ENUM('novo','usado','recondicionado') DEFAULT 'novo',
  status        ENUM('ativo','pausado','vendido','removido') DEFAULT 'ativo',
  frete_gratis  BOOLEAN DEFAULT FALSE,
  avaliacao_media DECIMAL(3,2) DEFAULT 0,
  total_vendas  INT DEFAULT 0,
  criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id)  REFERENCES categorias(id)  ON DELETE SET NULL,
  FOREIGN KEY (vendedor_id)   REFERENCES usuarios(id)    ON DELETE CASCADE
);

-- -------------------------------------------------------
-- IMAGENS DE PRODUTOS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS produto_imagens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  produto_id  INT NOT NULL,
  url         VARCHAR(500) NOT NULL,
  principal   BOOLEAN DEFAULT FALSE,
  ordem       INT DEFAULT 0,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- CARRINHO
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrinho (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  produto_id  INT NOT NULL,
  quantidade  INT NOT NULL DEFAULT 1,
  adicionado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_carrinho (usuario_id, produto_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- PEDIDOS (Campos de frete e endereço embutidos nativamente)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  comprador_id    INT NOT NULL,
  status          ENUM('aguardando_pagamento','pago','enviado','entregue','cancelado') DEFAULT 'aguardando_pagamento',
  total           DECIMAL(12,2) NOT NULL,
  endereco_id     INT,
  valor_frete     DECIMAL(10,2) DEFAULT 0.00,
  metodo_pagamento ENUM('pix','cartao_credito','boleto') DEFAULT 'pix',
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (comprador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (endereco_id)  REFERENCES enderecos(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- ITENS DO PEDIDO
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido_itens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id   INT NOT NULL,
  produto_id  INT NOT NULL,
  quantidade  INT NOT NULL,
  preco_unit  DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id)  ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- AVALIAÇÕES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  produto_id  INT NOT NULL,
  usuario_id  INT NOT NULL,
  pedido_id   INT,
  nota        TINYINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario  TEXT,
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_avaliacao (produto_id, usuario_id),
  FOREIGN KEY (produto_id)  REFERENCES produtos(id)  ON DELETE CASCADE,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)   ON DELETE SET NULL
);

-- -------------------------------------------------------
-- FAVORITOS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS favoritos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  produto_id  INT NOT NULL,
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_favorito (usuario_id, produto_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- ============================================================
-- DADOS INICIAIS (SEED)
-- ============================================================

-- Categorias
INSERT INTO categorias (nome, slug, icone) VALUES
  ('Eletrônicos',       'eletronicos',      '💻'),
  ('Moda',              'moda',             '👗'),
  ('Casa e Jardim',     'casa-jardim',      '🏠'),
  ('Esportes',          'esportes',         '⚽'),
  ('Livros',            'livros',           '📚'),
  ('Beleza',            'beleza',           '💄'),
  ('Automóveis',        'automoveis',       '🚗'),
  ('Brinquedos',        'brinquedos',       '🧸');

-- Usuários
INSERT INTO usuarios (nome, email, senha, cpf, telefone, reputacao, is_admin) VALUES
  ('Admin Sistema',  'admin@ml.com',   '$2a$10$s6KeRncvgOEqi/e.Krhi1eMUA2iiU.LbgfWWYi2CB.ZE49bNBMdra', '000.000.000-00', '(11) 99999-0000', 5.0, TRUE),
  ('João Silva',     'joao@email.com', '$2a$10$s6KeRncvgOEqi/e.Krhi1eMUA2iiU.LbgfWWYi2CB.ZE49bNBMdra', '111.111.111-11', '(11) 98765-4321', 4.8, FALSE),
  ('Maria Souza',    'maria@email.com','$2a$10$s6KeRncvgOEqi/e.Krhi1eMUA2iiU.LbgfWWYi2CB.ZE49bNBMdra', '222.222.222-22', '(11) 91234-5678', 4.5, FALSE),
  ('Carlos Oliveira','carlos@email.com','$2a$10$s6KeRncvgOEqi/e.Krhi1eMUA2iiU.LbgfWWYi2CB.ZE49bNBMdra','333.333.333-33', '(21) 97654-3210', 4.9, FALSE);

-- Produtos
INSERT INTO produtos (titulo, descricao, preco, preco_original, estoque, categoria_id, vendedor_id, condicao, frete_gratis) VALUES
  ('Smartphone Samsung Galaxy A54 128GB', 'Tela AMOLED 6.4", câmera tripla 50MP, bateria 5000mAh.', 1299.90, 1599.90, 50, 1, 2, 'novo', TRUE),
  ('Notebook Dell Inspiron 15 i5 8GB 256GB SSD', 'Processador Intel Core i5, 8GB RAM DDR4, SSD 256GB.', 3199.00, 3799.00, 15, 1, 2, 'novo', TRUE),
  ('Fone Bluetooth JBL Tune 510BT', 'Até 40h de bateria, som puro com graves potentes.', 249.90, 349.90, 120, 1, 3, 'novo', FALSE),
  ('Tênis Nike Air Max 270 Masculino', 'Amortecimento Air Max de grande volume no calcanhar.', 549.90, 699.90, 30, 2, 3, 'novo', TRUE),
  ('Camiseta Polo Ralph Lauren Masculina', 'Algodão pima de alta qualidade, bordado icônico.', 189.90, NULL, 80, 2, 4, 'novo', FALSE),
  ('Jogo de Panelas Tramontina 5 Peças', 'Antiaderente, cabo ergonômico.', 399.90, 499.90, 25, 3, 4, 'novo', TRUE),
  ('Bicicleta MTB Caloi Explorer 21V', 'Quadro de alumínio, suspensão dianteira.', 1899.00, 2299.00, 8, 4, 2, 'novo', FALSE),
  ('Clean Code - Robert C. Martin', 'A handbook of agile software craftsmanship.', 89.90, 119.90, 200, 5, 3, 'novo', TRUE),
  ('Kit Skincare Neutrogena Hidratante', 'Hidratante facial, sérum vitamina C e protetor solar.', 159.90, 219.90, 60, 6, 4, 'novo', FALSE),
  ('Smart TV Samsung 50" 4K QLED', 'Resolução 4K, tecnologia Quantum Dot.', 2799.00, 3499.00, 12, 1, 2, 'novo', TRUE),
  ('Capa de Banco Automotiva Couro', 'Conjunto completo dianteiro e traseiro.', 349.90, 429.90, 35, 7, 3, 'novo', FALSE),
  ('LEGO Star Wars Millennium Falcon', 'Set com 1353 peças, inclui minifiguras.', 699.90, 849.90, 20, 8, 4, 'novo', TRUE);

-- Imagens dos produtos
INSERT INTO produto_imagens (produto_id, url, principal, ordem) VALUES
  (1, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTN5ZXdkWTlOn_xTQwWQDfx0bFs4kfEjrnhIw&s',    TRUE,  0),
  (1, 'https://imgs.casasbahia.com.br/55058955/6g.jpg?imwidth=500',    FALSE, 1),
  (2, 'https://images.tcdn.com.br/img/img_prod/740836/notebook_dell_inspiron_3511_core_i5_1135g7_memoria_8gb_ssd_256gb_tela_15_6_led_fhd_windows_11_home_13123_3_89183e5ec635ae28c35eca1fe17d6c7b.jpg',   TRUE,  0),
  (2, 'https://images.tcdn.com.br/img/img_prod/740836/notebook_dell_inspiron_3511_core_i5_1135g7_memoria_8gb_ssd_256gb_tela_15_6_led_fhd_windows_11_home_13123_1_29a8236f4adde1c028fd96952260cc0d.jpg',   FALSE, 1),
  (3, 'https://m.media-amazon.com/images/I/61kFL7ywsZS.jpg',     TRUE,  0),
  (4, 'https://imgnike-a.akamaihd.net/1300x1300/005235IDA6.jpg',    TRUE,  0),
  (5, 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTgBidqFVOeAOzIkeHsYrHbO5yVfLqMPJ8YO_Ur_5YXmptZFB7qWBKJwFDgUkAcnbR0QDTHsQ6hj_DYVHT4D309gbdaWJo3OvIDcgokOIGr8sETQS4j4xPJA3-K5FJYerBSab7h1g&usqp=CAc',   TRUE,  0),
  (6, 'https://images.tcdn.com.br/img/img_prod/1233679/jogo_panelas_5_pecas_paris_chumbo_28599_601_tramontina_2663_1_83d10eaecb51eba448b030e32a23f0bd.jpg',   TRUE,  0),
  (7, 'https://www.ecompletocdn.com.br/i/fp/1340/1538054_1.jpg',     TRUE,  0),
  (8, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWIHoF9DMHtFjVHGBsnHlItfF7rKJjDjPBhA&s',    TRUE,  0),
  (9, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTpoRkdMAtS0KaN-MS9YlhG18Vr0RRYF2c0w&s',     TRUE,  0),
  (10,'https://samsungbrshop.vtexassets.com/arquivos/ids/235703/SA365_SMG_Q60D_BlackFriday_1000x1000_imagem_01_20240802.jpg?v=638586617747570000',       TRUE,  0),
  (11,'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcScXc5GSIedvrT_ai1Q1wHpqG-aY6Yv3YncxW4fq83TH5A3JSyIqKwVKfVMPOima6l6KefU2JBqb4lMvj3u9LlyAx5Th_jIrBI3P3NiagGs3ku82sGnWap86_O7jYHvikNG-fNJ6cV1ag&usqp=CAc',     TRUE,  0),
  (12,'https://m.media-amazon.com/images/I/81nIauS111L.jpg',     TRUE,  0);