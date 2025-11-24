import { useSQLiteContext } from 'expo-sqlite';

export function useVendasDatabase() {
  const database = useSQLiteContext();

  async function create(data) {
    const valor_total = data.quantidade * data.preco_unitario;
    const statement = await database.prepareAsync(
      `INSERT INTO vendas (produto_nome, quantidade, preco_unitario, valor_total) VALUES ($produto_nome, $quantidade, $preco_unitario, $valor_total)`
    );
    try {
      const result = await statement.executeAsync({
        $produto_nome: data.produto_nome,
        $quantidade: data.quantidade,
        $preco_unitario: data.preco_unitario,
        $valor_total: valor_total,
      });
      return { insertedRowId: result.lastInsertRowId, valor_total };
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function remove(id) {
    await database.execAsync(`DELETE FROM vendas WHERE id = ${id}`);
  }

  async function getVendasHoje() {
    return await database.getAllAsync(`SELECT * FROM vendas WHERE date(data_venda) = date('now','localtime') ORDER BY data_venda DESC`);
  }

  async function getVendasPorPeriodo(dataInicio, dataFim) {
    return await database.getAllAsync(`SELECT * FROM vendas WHERE date(data_venda) BETWEEN ? AND ? ORDER BY data_venda DESC`, [dataInicio, dataFim]);
  }

  async function getResumoHoje() {
    const result = await database.getFirstAsync(
      `SELECT COUNT(*) as total_vendas, COALESCE(SUM(valor_total), 0) as valor_total, COALESCE(SUM(quantidade), 0) as qtd_itens FROM vendas WHERE date(data_venda) = date('now','localtime')`
    );
    return result || { total_vendas: 0, valor_total: 0, qtd_itens: 0 };
  }

  async function getResumoPorPeriodo(dataInicio, dataFim) {
    const result = await database.getFirstAsync(
      `SELECT COUNT(*) as total_vendas, COALESCE(SUM(valor_total), 0) as valor_total, COALESCE(SUM(quantidade), 0) as qtd_itens FROM vendas WHERE date(data_venda) BETWEEN ? AND ?`,
      [dataInicio, dataFim]
    );
    return result || { total_vendas: 0, valor_total: 0, qtd_itens: 0 };
  }

  async function getProdutosMaisVendidos(dataInicio, dataFim, limite = 10) {
    let query = `SELECT produto_nome, SUM(quantidade) as quantidade_total, SUM(valor_total) as valor_total FROM vendas`;
    const params = [];
    
    if (dataInicio && dataFim) {
      query += ` WHERE date(data_venda) BETWEEN ? AND ?`;
      params.push(dataInicio, dataFim);
    }
    
    query += ` GROUP BY produto_nome ORDER BY quantidade_total DESC LIMIT ${limite}`;
    return await database.getAllAsync(query, params);
  }

  async function getFaturamentoPorDia(dias = 7) {
    return await database.getAllAsync(
      `SELECT date(data_venda) as dia, SUM(valor_total) as total FROM vendas WHERE data_venda >= datetime('now', '-${dias} days', 'localtime') GROUP BY date(data_venda) ORDER BY dia ASC`
    );
  }

  async function exportarDados(dataInicio, dataFim) {
    const vendas = await getVendasPorPeriodo(dataInicio, dataFim);
    return JSON.stringify(vendas, null, 2);
  }

  return { create, remove, getVendasHoje, getVendasPorPeriodo, getResumoHoje, getResumoPorPeriodo, getProdutosMaisVendidos, getFaturamentoPorDia, exportarDados };
}
