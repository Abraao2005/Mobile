export async function initializeDatabase(database) {
  // Tabela de produtos
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      preco REAL NOT NULL,
      ativo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Tabela de vendas
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      valor_total REAL NOT NULL,
      data_venda TEXT DEFAULT (datetime('now','localtime')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Criar índices para melhor performance
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);`);
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);`);
}
