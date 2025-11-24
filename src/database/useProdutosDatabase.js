import { useSQLiteContext } from 'expo-sqlite';

export function useProdutosDatabase() {
  const database = useSQLiteContext();

  async function create(data) {
    const statement = await database.prepareAsync('INSERT INTO produtos (nome, preco) VALUES ($nome, $preco)');
    try {
      const result = await statement.executeAsync({ $nome: data.nome, $preco: data.preco });
      return { insertedRowId: result.lastInsertRowId };
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function update(id, data) {
    const fields = [];
    const values = { $id: id };
    
    if (data.nome !== undefined) { fields.push('nome = $nome'); values.$nome = data.nome; }
    if (data.preco !== undefined) { fields.push('preco = $preco'); values.$preco = data.preco; }
    if (data.ativo !== undefined) { fields.push('ativo = $ativo'); values.$ativo = data.ativo; }
    
    if (fields.length === 0) return;
    
    const statement = await database.prepareAsync(`UPDATE produtos SET ${fields.join(', ')} WHERE id = $id`);
    try {
      await statement.executeAsync(values);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function remove(id) {
    await database.execAsync(`DELETE FROM produtos WHERE id = ${id}`);
  }

  async function getAll(onlyActive = true) {
    const query = onlyActive 
      ? 'SELECT * FROM produtos WHERE ativo = 1 ORDER BY nome'
      : 'SELECT * FROM produtos ORDER BY nome';
    return await database.getAllAsync(query);
  }

  async function getById(id) {
    return await database.getFirstAsync('SELECT * FROM produtos WHERE id = ?', [id]);
  }

  async function searchByName(nome) {
    return await database.getAllAsync('SELECT * FROM produtos WHERE nome LIKE ? AND ativo = 1 ORDER BY nome', [`%${nome}%`]);
  }

  return { create, update, remove, getAll, getById, searchByName };
}
