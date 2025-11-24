import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Configuracoes() {
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalVendas, setTotalVendas] = useState(0);
  const [valorTotalVendas, setValorTotalVendas] = useState(0);
  const database = useSQLiteContext();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const prodResult = await database.getFirstAsync('SELECT COUNT(*) as count FROM produtos');
      const vendaResult = await database.getFirstAsync(
        'SELECT COUNT(*) as count, COALESCE(SUM(valor_total), 0) as total FROM vendas'
      );
      setTotalProdutos(prodResult?.count || 0);
      setTotalVendas(vendaResult?.count || 0);
      setValorTotalVendas(vendaResult?.total || 0);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const exportarBackupJSON = async () => {
    try {
      const produtos = await database.getAllAsync('SELECT * FROM produtos');
      const vendas = await database.getAllAsync('SELECT * FROM vendas');
      
      const backup = {
        versao: '1.0',
        data_exportacao: new Date().toISOString(),
        total_produtos: produtos.length,
        total_vendas: vendas.length,
        produtos,
        vendas,
      };
      
      const jsonString = JSON.stringify(backup, null, 2);
      
      await Share.share({
        message: jsonString,
        title: 'Backup Faturamento App',
      });
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar backup');
    }
  };

  const exportarCSV = async () => {
    try {
      const vendas = await database.getAllAsync('SELECT * FROM vendas ORDER BY data_venda DESC');
      
      if (vendas.length === 0) {
        Alert.alert('Aviso', 'Não há vendas para exportar');
        return;
      }
      
      let csv = 'ID;Produto;Quantidade;Preco Unitario;Valor Total;Data Venda\n';
      
      vendas.forEach(v => {
        csv += `${v.id};"${v.produto_nome}";${v.quantidade};${v.preco_unitario.toFixed(2).replace('.', ',')};${v.valor_total.toFixed(2).replace('.', ',')};"${v.data_venda}"\n`;
      });
      
      await Share.share({
        message: csv,
        title: 'Vendas CSV',
      });
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar CSV');
    }
  };

  const limparVendas = () => {
    Alert.alert(
      'Limpar Vendas',
      'Tem certeza que deseja apagar TODAS as vendas? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar Tudo',
          style: 'destructive',
          onPress: async () => {
            await database.execAsync('DELETE FROM vendas');
            loadStats();
            Alert.alert('Sucesso', 'Todas as vendas foram removidas');
          },
        },
      ]
    );
  };

  const limparProdutos = () => {
    Alert.alert(
      'Limpar Produtos',
      'Tem certeza que deseja apagar TODOS os produtos? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar Tudo',
          style: 'destructive',
          onPress: async () => {
            await database.execAsync('DELETE FROM produtos');
            loadStats();
            Alert.alert('Sucesso', 'Todos os produtos foram removidos');
          },
        },
      ]
    );
  };

  const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const formatNumber = (num) => num.toLocaleString('pt-BR');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Estatísticas Gerais</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="pricetag" size={28} color="#2196F3" />
          <Text style={styles.statValue}>{formatNumber(totalProdutos)}</Text>
          <Text style={styles.statLabel}>Produtos</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="receipt" size={28} color="#4CAF50" />
          <Text style={styles.statValue}>{formatNumber(totalVendas)}</Text>
          <Text style={styles.statLabel}>Vendas</Text>
        </View>
      </View>
      
      <View style={styles.totalCard}>
        <Ionicons name="cash" size={32} color="#4CAF50" />
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Total Faturado</Text>
          <Text style={styles.totalValue}>{formatCurrency(valorTotalVendas)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Backup e Exportação</Text>
      <TouchableOpacity style={styles.actionButton} onPress={exportarBackupJSON}>
        <Ionicons name="download" size={24} color="#fff" />
        <Text style={styles.actionButtonText}>Exportar Backup Completo (JSON)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} onPress={exportarCSV}>
        <Ionicons name="document-text" size={24} color="#fff" />
        <Text style={styles.actionButtonText}>Exportar Vendas (CSV)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Gerenciar Dados</Text>
      <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={limparVendas}>
        <Ionicons name="trash" size={24} color="#fff" />
        <Text style={styles.actionButtonText}>Limpar Todas as Vendas</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={limparProdutos}>
        <Ionicons name="trash" size={24} color="#fff" />
        <Text style={styles.actionButtonText}>Limpar Todos os Produtos</Text>
      </TouchableOpacity>

      <View style={styles.appInfo}>
        <Text style={styles.appName}>Sistema de Faturamento</Text>
        <Text style={styles.appVersion}>Versão 1.0.0</Text>
        <Text style={styles.appDescription}>
          Desenvolvido para controle de vendas de pequenos empreendimentos.
          Funciona 100% offline, sem necessidade de internet.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  totalCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
    elevation: 2,
  },
  totalInfo: {
    marginLeft: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  appInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    elevation: 2,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
