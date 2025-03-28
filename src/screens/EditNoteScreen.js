import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const NOTE_COLORS = [
  '#B5EAD7',
  '#C7CEEA',
  '#FFB7B2',
  '#FFDAC1',
  '#E2F0CB',
  '#FDCFF3',
];

const EditNoteScreen = ({ route, navigation }) => {
  const { note, isNew, userId, userName, onNoteAdded, onNoteUpdated } = route.params || {};
  
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.text || '');
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    note?.color || NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
  );

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề ghi chú');
      return;
    }

    try {
      setLoading(true);
      const notesRef = firestore().collection('notes');
      
      if (isNew) {
        await notesRef.add({
          title: title,
          text: content,
          color: selectedColor,
          userId: userId,
          userName: userName,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        
        if (onNoteAdded && typeof onNoteAdded === 'function') {
          onNoteAdded();
        }
      } else {
        await notesRef.doc(note.id).update({
          title: title,
          text: content,
          color: selectedColor,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        
        if (onNoteUpdated && typeof onNoteUpdated === 'function') {
          onNoteUpdated();
        }
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Lỗi khi lưu ghi chú:', error);
      Alert.alert('Lỗi', 'Không thể lưu ghi chú. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa ghi chú này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await firestore().collection('notes').doc(note.id).delete();
              if (onNoteUpdated && typeof onNoteUpdated === 'function') {
                onNoteUpdated();
              }
              navigation.goBack();
            } catch (error) {
              console.error('Lỗi khi xóa ghi chú:', error);
              Alert.alert('Lỗi', 'Không thể xóa ghi chú. Vui lòng thử lại.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: selectedColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Note</Text>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
              <Text style={styles.iconText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
              <Text style={styles.iconText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <ActivityIndicator size="large" color="#333" style={styles.loader} />
        )}

        <ScrollView style={styles.contentContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Homework"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          
          <TextInput
            style={styles.contentInput}
            placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.colorPicker}>
          {NOTE_COLORS.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColor
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    minHeight: 300,
    color: '#333',
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -15,
    marginTop: -15,
    zIndex: 999,
  },
});

export default EditNoteScreen; 