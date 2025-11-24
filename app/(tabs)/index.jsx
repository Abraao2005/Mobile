import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useVendasDatabase } from '../../src/database/useVendasDatabase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const [resumo, setResumo] = useState({ total_vendas: 0, valor_total: 0, qtd_itens: 0 });
  const [produtoTop, setProdutoTop] = useState(null);
  const [faturamentoSemana, setFaturamentoSemana] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const vendasDB = useVendasDatabase();

  const loadData = async () => {
    try {
      const resumoHoje = await vendasDB.getResumoHoje();
      setResumo(resumoHoje);
      
      const produtos = await vendasDB.getProdutosMaisVendidos(undefined, undefined, 1);
      setProdutoTop(produtos[0] || null);
      
      const faturamento = await vendasDB.getFaturamentoPorDia(7);
      setFaturamentoSemana(faturamento);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (value) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const maxFaturamento = Math.max(...faturamentoSemana.map(f => f.total), 1);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />}
    >
      <Text style={styles.title}>Resumo do Dia</Text>
      
      <View style={styles.cardsContainer}>
        <View style={[styles.card, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="cash" size={32} color="#fff" />
          <Text style={styles.cardValue}>{formatCurrency(resumo.valor_total)}</Text>
          <Text style={styles.cardLabel}>Faturamento</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#2196F3' }]}>
          <Ionicons name="receipt" size={32} color="#fff" />
          <Text style={styles.cardValue}>{resumo.total_vendas}</Text>
          <Text style={styles.cardLabel}>Vendas</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#FF9800' }]}>
          <Ionicons name="cube" size={32} color="#fff" />
          <Text style={styles.cardValue}>{resumo.qtd_itens}</Text>
          <Text style={styles.cardLabel}>Itens Vendidos</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#9C27B0' }]}>
          <Ionicons name="trophy" size={32} color="#fff" />
          <Text style={styles.cardValue} numberOfLines={1}>{produtoTop?.produto_nome || '-'}</Text>
          <Text style={styles.cardLabel}>Mais Vendido</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Faturamento - Últimos 7 dias</Text>
      
      <View style={styles.chartContainer}>
        {faturamentoSemana.length === 0 ? (
          <Text style={styles.emptyText}>Sem dados para exibir</Text>
        ) : (
          faturamentoSemana.map((item, index) => (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.barValue}>{formatCurrency(item.total)}</Text>
              <View style={[styles.bar, { height: (item.total / maxFaturamento) * 120 }]} />
              <Text style={styles.barLabel}>{item.dia.substring(8, 10)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 12 },
  cardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardValue: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  cardLabel: { fontSize: 12, color: '#fff', marginTop: 4, opacity: 0.9 },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minHeight: 180,
    elevation: 2,
  },
  barContainer: { alignItems: 'center', flex: 1 },
  bar: { width: 24, backgroundColor: '#2196F3', borderRadius: 4, minHeight: 4 },
  barValue: { fontSize: 10, color: '#666', marginBottom: 4, textAlign: 'center' },
  barLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  emptyText: { color: '#999', textAlign: 'center', width: '100%' },
});
