import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useProdutosDatabase } from '../../src/database/useProdutosDatabase';
import { useVendasDatabase } from '../../src/database/useVendasDatabase';
import { Ionicons } from '@expo/vector-icons';

export default function Vendas() {
  const [produtos, setProdutos] = useState([]);
  const [vendasHoje, setVendasHoje] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [quantidade, setQuantidade] = useState('1');
  const [buscaProduto, setBuscaProduto] = useState('');
  
  const produtosDB = useProdutosDatabase();
  const vendasDB = useVendasDatabase();

  const loadData = async () => {
    try {
      const prods = buscaProduto ? await produtosDB.searchByName(buscaProduto) : await produtosDB.getAll(true);
      setProdutos(prods);
      const vendas = await vendasDB.getVendasHoje();
      setVendasHoje(vendas);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [buscaProduto]));

  const handleSelectProduto = (produto) => {
    setSelectedProduto(produto);
    setQuantidade('1');
    setModalVisible(true);
  };

  const handleRegistrarVenda = async () => {
    if (!selectedProduto) return;
    const qtd = parseInt(quantidade) || 0;
    if (qtd <= 0) return Alert.alert('Erro', 'Quantidade deve ser maior que zero');

    try {
      await vendasDB.create({
        produto_nome: selectedProduto.nome,
        quantidade: qtd,
        preco_unitario: selectedProduto.preco,
      });
      setModalVisible(false);
      loadData();
      Alert.alert('Sucesso', `Venda de ${qtd}x ${selectedProduto.nome} registrada!`);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao registrar venda');
    }
  };

  const handleRemoverVenda = (venda) => {
    Alert.alert('Remover Venda', `Deseja remover esta venda de ${venda.produto_nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        await vendasDB.remove(venda.id);
        loadData();
      }}
    ]);
  };

  const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatTime = (date) => date.substring(11, 16);

  const renderProduto = ({ item }) => (
    <TouchableOpacity style={styles.produtoCard} onPress={() => handleSelectProduto(item)}>
      <Text style={styles.produtoNome}>{item.nome}</Text>
      <Text style={styles.produtoPreco}>{formatCurrency(item.preco)}</Text>
    </TouchableOpacity>
  );

  const renderVenda = ({ item }) => (
    <View style={styles.vendaItem}>
      <View style={styles.vendaInfo}>
        <Text style={styles.vendaNome}>{item.produto_nome}</Text>
        <Text style={styles.vendaDetalhes}>
          {item.quantidade}x {formatCurrency(item.preco_unitario)} = {formatCurrency(item.valor_total)}
        </Text>
        <Text style={styles.vendaHora}>{formatTime(item.data_venda)}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoverVenda(item)} style={styles.removeBtn}>
        <Ionicons name="trash" size={20} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Selecione um produto</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput style={styles.searchInput} placeholder="Buscar..." value={buscaProduto} onChangeText={setBuscaProduto} />
      </View>
      
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduto}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.produtosList}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum produto ativo</Text>}
      />

      <Text style={styles.sectionTitle}>Vendas de Hoje ({vendasHoje.length})</Text>
      <FlatList
        data={vendasHoje}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVenda}
        style={styles.vendasList}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma venda registrada hoje</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Venda</Text>
            {selectedProduto && (
              <>
                <Text style={styles.produtoSelecionado}>{selectedProduto.nome}</Text>
                <Text style={styles.precoUnitario}>Preço: {formatCurrency(selectedProduto.preco)}</Text>
                
                <View style={styles.qtdContainer}>
                  <TouchableOpacity style={styles.qtdBtn} onPress={() => setQuantidade(String(Math.max(1, (parseInt(quantidade) || 0) - 1)))}>
                    <Ionicons name="remove" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TextInput style={styles.qtdInput} value={quantidade} onChangeText={setQuantidade} keyboardType="number-pad" textAlign="center" />
                  <TouchableOpacity style={styles.qtdBtn} onPress={() => setQuantidade(String((parseInt(quantidade) || 0) + 1))}>
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.totalVenda}>
                  Total: {formatCurrency(selectedProduto.preco * (parseInt(quantidade) || 0))}
                </Text>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleRegistrarVenda}>
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, elevation: 2 },
  searchInput: { flex: 1, height: 40, marginLeft: 8, fontSize: 14 },
  produtosList: { maxHeight: 100, marginBottom: 16 },
  produtoCard: { backgroundColor: '#2196F3', borderRadius: 8, padding: 12, marginRight: 8, minWidth: 100, alignItems: 'center' },
  produtoNome: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  produtoPreco: { color: '#fff', fontSize: 12, marginTop: 4 },
  vendasList: { flex: 1 },
  vendaItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 2 },
  vendaInfo: { flex: 1 },
  vendaNome: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  vendaDetalhes: { fontSize: 12, color: '#666', marginTop: 2 },
  vendaHora: { fontSize: 10, color: '#999', marginTop: 2 },
  removeBtn: { justifyContent: 'center', padding: 8 },
  emptyText: { color: '#999', textAlign: 'center', paddingVertical: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  produtoSelecionado: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },
  precoUnitario: { fontSize: 14, color: '#666', marginTop: 4 },
  qtdContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  qtdBtn: { backgroundColor: '#2196F3', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  qtdInput: { width: 80, height: 48, fontSize: 24, fontWeight: 'bold', marginHorizontal: 16, backgroundColor: '#f5f5f5', borderRadius: 8 },
  totalVenda: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', width: '100%' },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f5f5f5', marginRight: 8 },
  confirmBtn: { backgroundColor: '#4CAF50', marginLeft: 8 },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },
});
