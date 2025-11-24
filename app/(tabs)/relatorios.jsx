import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Share, Alert } from 'react-native';
import { useVendasDatabase } from '../../src/database/useVendasDatabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFim, setDataFim] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [produtosTop, setProdutosTop] = useState([]);
  const [activeTab, setActiveTab] = useState('faturamento');
  
  const vendasDB = useVendasDatabase();

  const formatDate = (date) => date.toISOString().split('T')[0];
  const formatDateBR = (date) => date.toLocaleDateString('pt-BR');
  const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(null);
    if (selectedDate) {
      if (showDatePicker === 'inicio') setDataInicio(selectedDate);
      else setDataFim(selectedDate);
    }
  };

  const handleBuscar = async () => {
    try {
      const di = formatDate(dataInicio);
      const df = formatDate(dataFim);
      
      const res = await vendasDB.getResumoPorPeriodo(di, df);
      setResumo(res);
      
      const vds = await vendasDB.getVendasPorPeriodo(di, df);
      setVendas(vds);
      
      const prods = await vendasDB.getProdutosMaisVendidos(di, df, 10);
      setProdutosTop(prods);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao buscar dados');
    }
  };

  const handleExportar = () => {
    Alert.alert('Exportar Relatório', 'Escolha o formato:', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'JSON', onPress: exportarJSON },
      { text: 'CSV', onPress: exportarCSV },
    ]);
  };

  const exportarJSON = async () => {
    try {
      const dados = await vendasDB.exportarDados(formatDate(dataInicio), formatDate(dataFim));
      await Share.share({ message: dados, title: `Relatório ${formatDateBR(dataInicio)} - ${formatDateBR(dataFim)}` });
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar JSON');
    }
  };

  const exportarCSV = async () => {
    try {
      const vendasExport = await vendasDB.getVendasPorPeriodo(formatDate(dataInicio), formatDate(dataFim));
      if (vendasExport.length === 0) return Alert.alert('Aviso', 'Não há vendas no período');
      
      let csv = 'ID;Produto;Quantidade;Preco Unitario;Valor Total;Data Venda\n';
      vendasExport.forEach(v => {
        csv += `${v.id};"${v.produto_nome}";${v.quantidade};${v.preco_unitario.toFixed(2).replace('.', ',')};${v.valor_total.toFixed(2).replace('.', ',')};"${v.data_venda}"\n`;
      });
      
      await Share.share({ message: csv, title: `Vendas_${formatDate(dataInicio)}_${formatDate(dataFim)}.csv` });
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar CSV');
    }
  };

  const renderVenda = ({ item }) => (
    <View style={styles.vendaItem}>
      <Text style={styles.vendaNome}>{item.produto_nome}</Text>
      <Text style={styles.vendaDetalhes}>{item.quantidade}x {formatCurrency(item.preco_unitario)}</Text>
      <Text style={styles.vendaTotal}>{formatCurrency(item.valor_total)}</Text>
    </View>
  );

  const renderProdutoTop = ({ item, index }) => (
    <View style={styles.produtoTopItem}>
      <Text style={styles.produtoRank}>#{index + 1}</Text>
      <View style={styles.produtoTopInfo}>
        <Text style={styles.produtoTopNome}>{item.produto_nome}</Text>
        <Text style={styles.produtoTopQtd}>{item.quantidade_total} vendidos</Text>
      </View>
      <Text style={styles.produtoTopTotal}>{formatCurrency(item.valor_total)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.dateContainer}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('inicio')}>
          <Ionicons name="calendar" size={20} color="#2196F3" />
          <Text style={styles.dateText}>{formatDateBR(dataInicio)}</Text>
        </TouchableOpacity>
        <Text style={styles.dateSeperator}>até</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker('fim')}>
          <Ionicons name="calendar" size={20} color="#2196F3" />
          <Text style={styles.dateText}>{formatDateBR(dataFim)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.buscarBtn} onPress={handleBuscar}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.buscarBtnText}>Buscar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportarBtn} onPress={handleExportar}>
          <Ionicons name="share" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {resumo && (
        <View style={styles.resumoContainer}>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoValue}>{formatCurrency(resumo.valor_total)}</Text>
            <Text style={styles.resumoLabel}>Total Faturado</Text>
          </View>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoValue}>{resumo.total_vendas}</Text>
            <Text style={styles.resumoLabel}>Vendas</Text>
          </View>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoValue}>{resumo.qtd_itens}</Text>
            <Text style={styles.resumoLabel}>Itens</Text>
          </View>
        </View>
      )}

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'faturamento' && styles.tabActive]} onPress={() => setActiveTab('faturamento')}>
          <Text style={[styles.tabText, activeTab === 'faturamento' && styles.tabTextActive]}>Faturamento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'produtos' && styles.tabActive]} onPress={() => setActiveTab('produtos')}>
          <Text style={[styles.tabText, activeTab === 'produtos' && styles.tabTextActive]}>Produtos Top</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'faturamento' ? (
        <FlatList data={vendas} keyExtractor={(item) => item.id.toString()} renderItem={renderVenda}
          ListEmptyComponent={<Text style={styles.emptyText}>Selecione um período e clique em Buscar</Text>}
          contentContainerStyle={vendas.length === 0 && styles.emptyContainer} />
      ) : (
        <FlatList data={produtosTop} keyExtractor={(item) => item.produto_nome} renderItem={renderProdutoTop}
          ListEmptyComponent={<Text style={styles.emptyText}>Selecione um período e clique em Buscar</Text>}
          contentContainerStyle={produtosTop.length === 0 && styles.emptyContainer} />
      )}

      {showDatePicker && (
        <DateTimePicker value={showDatePicker === 'inicio' ? dataInicio : dataFim} mode="date" display="default" onChange={handleDateChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, elevation: 2 },
  dateText: { marginLeft: 8, fontSize: 14, color: '#333' },
  dateSeperator: { marginHorizontal: 12, color: '#666' },
  buttonsRow: { flexDirection: 'row', marginBottom: 16 },
  buscarBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#2196F3', padding: 14, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  buscarBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  exportarBtn: { backgroundColor: '#fff', padding: 14, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  resumoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  resumoCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4, elevation: 2 },
  resumoValue: { fontSize: 16, fontWeight: 'bold', color: '#2196F3' },
  resumoLabel: { fontSize: 10, color: '#666', marginTop: 4 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 4, marginBottom: 12 },
  tab: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center' },
  tabActive: { backgroundColor: '#2196F3' },
  tabText: { color: '#666', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  vendaItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 2, alignItems: 'center' },
  vendaNome: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#333' },
  vendaDetalhes: { fontSize: 12, color: '#666', marginRight: 12 },
  vendaTotal: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
  produtoTopItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 2, alignItems: 'center' },
  produtoRank: { fontSize: 18, fontWeight: 'bold', color: '#FF9800', width: 40 },
  produtoTopInfo: { flex: 1 },
  produtoTopNome: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  produtoTopQtd: { fontSize: 12, color: '#666' },
  produtoTopTotal: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
  emptyText: { textAlign: 'center', color: '#999', padding: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
