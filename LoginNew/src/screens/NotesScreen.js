import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const NOTE_COLORS = [
  '#B5EAD7',
  '#C7CEEA',
  '#FFB7B2',
  '#FFDAC1',
  '#E2F0CB',
  '#FDCFF3',
];

const NotesScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      setUser(currentUser);
    } else {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng chức năng ghi chú');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [navigation]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      const notesRef = firestore().collection('notes');
      
      const notesCollection = await notesRef
        .where('userId', '==', user.uid)
        .get();

      if (!notesCollection.empty) {
        let notesData = notesCollection.docs.map(doc => {
          const data = doc.data();
          if (!data.color) {
            const randomColorIndex = Math.floor(Math.random() * NOTE_COLORS.length);
            data.color = NOTE_COLORS[randomColorIndex];
          }
          
          if (!data.title) {
            data.title = "Ghi chú";
          }
          
          return {
            id: doc.id,
            ...data,
            colorIndex: NOTE_COLORS.indexOf(data.color) !== -1 ? 
                        NOTE_COLORS.indexOf(data.color) : 
                        Math.floor(Math.random() * NOTE_COLORS.length),
          };
        });
        
        setNotes(notesData);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu ghi chú: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const addNote = () => {
    navigation.navigate('EditNote', { 
      isNew: true,
      userId: user.uid,
      userName: user.displayName || 'Người dùng',
      onNoteAdded: fetchNotes,
    });
  };

  const openNote = (note) => {
    navigation.navigate('EditNote', { 
      note,
      isNew: false,
      onNoteUpdated: fetchNotes,
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất');
    }
  };

  const filteredNotes = searchQuery 
    ? notes.filter(note => 
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        note.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  const renderNoteItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[styles.noteItem, { backgroundColor: item.color || NOTE_COLORS[item.colorIndex || 0] }]}
      onPress={() => openNote(item)}
    >
      <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.noteText} numberOfLines={4}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.iconText}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recent Notes</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing && (
        <ActivityIndicator size="large" color="#4285F4" style={styles.loader} />
      )}

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={item => item.id}
        numColumns={2}
        style={styles.notesList}
        contentContainerStyle={styles.notesListContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
            </View>
          )
        }
      />

      <TouchableOpacity 
        style={styles.addButton}
        onPress={addNote}
      >
        <Text style={styles.addButtonText}>➕</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>🚪</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  menuButton: {
    padding: 5,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 5,
  },
  notesList: {
    flex: 1,
  },
  notesListContent: {
    padding: 10,
  },
  noteItem: {
    flex: 1,
    margin: 6,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    minHeight: 150,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addButtonText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
    marginTop: -2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  loader: {
    marginTop: 20,
  },
  logoutButton: {
    position: 'absolute',
    left: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  logoutButtonText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
    marginTop: -2,
  },
});

export default NotesScreen; 