import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useProdutosDatabase } from '../../src/database/useProdutosDatabase';
import { Ionicons } from '@expo/vector-icons';

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [busca, setBusca] = useState('');
  
  const produtosDB = useProdutosDatabase();

  const loadProdutos = async () => {
    try {
      const data = busca 
        ? await produtosDB.searchByName(busca)
        : await produtosDB.getAll(false);
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  useFocusEffect(useCallback(() => { loadProdutos(); }, [busca]));

  const openModal = (produto) => {
    if (produto) {
      setEditingProduto(produto);
      setNome(produto.nome);
      setPreco(produto.preco.toFixed(2).replace('.', ','));
    } else {
      setEditingProduto(null);
      setNome('');
      setPreco('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) return Alert.alert('Erro', 'Informe o nome do produto');
    if (!preco.trim()) return Alert.alert('Erro', 'Informe o preço');
    
    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) return Alert.alert('Erro', 'Preço inválido');

    try {
      if (editingProduto) {
        await produtosDB.update(editingProduto.id, { nome: nome.trim(), preco: precoNum });
      } else {
        await produtosDB.create({ nome: nome.trim(), preco: precoNum });
      }
      setModalVisible(false);
      loadProdutos();
    } catch (error) {
      Alert.alert('Erro', error.message?.includes('UNIQUE') ? 'Produto já existe' : 'Erro ao salvar');
    }
  };

  const handleToggleAtivo = async (produto) => {
    Alert.alert(
      produto.ativo ? 'Desativar Produto' : 'Ativar Produto',
      `Deseja ${produto.ativo ? 'desativar' : 'ativar'} "${produto.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: async () => {
          await produtosDB.update(produto.id, { ativo: produto.ativo ? 0 : 1 });
          loadProdutos();
        }}
      ]
    );
  };

  const renderProduto = ({ item }) => (
    <View style={[styles.produtoItem, !item.ativo && styles.produtoInativo]}>
      <View style={styles.produtoInfo}>
        <Text style={[styles.produtoNome, !item.ativo && styles.textoInativo]}>{item.nome}</Text>
        <Text style={[styles.produtoPreco, !item.ativo && styles.textoInativo]}>
          R$ {item.preco.toFixed(2).replace('.', ',')}
        </Text>
      </View>
      <View style={styles.produtoActions}>
        <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
          <Ionicons name="pencil" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleToggleAtivo(item)} style={styles.actionBtn}>
          <Ionicons name={item.ativo ? 'eye-off' : 'eye'} size={20} color={item.ativo ? '#FF9800' : '#4CAF50'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto..."
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduto}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum produto cadastrado</Text>}
        contentContainerStyle={produtos.length === 0 && styles.emptyContainer}
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingProduto ? 'Editar Produto' : 'Novo Produto'}</Text>
            
            <TextInput style={styles.input} placeholder="Nome do produto" value={nome} onChangeText={setNome} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder="Preço (ex: 5,00)" value={preco} onChangeText={setPreco} keyboardType="decimal-pad" />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 8, paddingHorizontal: 12, elevation: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16 },
  produtoItem: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 8, padding: 16, elevation: 2 },
  produtoInativo: { backgroundColor: '#f0f0f0' },
  produtoInfo: { flex: 1 },
  produtoNome: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  produtoPreco: { fontSize: 14, color: '#4CAF50', marginTop: 4 },
  textoInativo: { color: '#999' },
  produtoActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8, marginLeft: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2196F3', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f5f5f5', marginRight: 8 },
  saveBtn: { backgroundColor: '#2196F3', marginLeft: 8 },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});
