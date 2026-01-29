import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { 
  getMessages, 
  sendMessage, 
  sendImageMessage,
  sendFileMessage,
  markMessagesAsRead, 
  subscribeToMessages,
  editMessage,
  deleteMessage,
  setTypingIndicator,
  subscribeToTypingIndicators,
} from '../../services/messageService';
import { Message } from '../../types/message.types';
import { Colors } from '../../constants/Colors';
import MessageBubble from '../../components/messaging/MessageBubble';
import TypingIndicator from '../../components/messaging/TypingIndicator';
import ImagePickerModal from '../../components/messaging/ImagePickerModal';
import { getFileSize } from '../../services/uploadService';

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId, otherUserId } = route.params;
  const { user } = useAuth() as any;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();

    const messageChannel = subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      if (newMessage.sender_id !== user?.id) {
        markAsRead();
      }
    });

    const typingChannel = subscribeToTypingIndicators(
      conversationId,
      user?.id || '',
      (typing) => {
        setIsTyping(typing);
      }
    );

    return () => {
      messageChannel.unsubscribe();
      typingChannel.unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  const loadMessages = async () => {
    const { data, error } = await getMessages(conversationId);
    if (!error && data) {
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const markAsRead = async () => {
    if (user) {
      await markMessagesAsRead(conversationId, user.id);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);

    // Send typing indicator
    if (user) {
      setTypingIndicator(conversationId, user.id, text.length > 0);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTypingIndicator(conversationId, user.id, false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    setLoading(true);

    if (editingMessageId) {
      // Edit existing message
      const { error } = await editMessage(editingMessageId, inputText.trim());
      if (error) {
        Alert.alert('Error', 'Failed to edit message');
      } else {
        // Update local state
        setMessages(prev =>
          prev.map(msg =>
            msg.id === editingMessageId
              ? { ...msg, content: inputText.trim(), is_edited: true }
              : msg
          )
        );
        setEditingMessageId(null);
      }
    } else {
      // Send new message
      const { error } = await sendMessage(conversationId, user.id, inputText.trim());
      if (error) {
        Alert.alert('Error', 'Failed to send message');
      }
    }

    setLoading(false);
    setInputText('');
    setTypingIndicator(conversationId, user.id, false);
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const handleImageSelected = async (uri: string) => {
    if (!user) return;

    setLoading(true);
    const { error } = await sendImageMessage(conversationId, user.id, uri);
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to send image');
    } else {
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const file = result.assets[0];
      const fileSize = await getFileSize(file.uri);

      // Check file size (max 10MB)
      if (fileSize > 10 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 10MB');
        return;
      }

      if (!user) return;

      setLoading(true);
      const { error } = await sendFileMessage(
        conversationId,
        user.id,
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        fileSize
      );
      setLoading(false);

      if (error) {
        Alert.alert('Error', 'Failed to send file');
      } else {
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      }
    } catch (error) {
      console.error('File picker error:', error);
    }
  };

  const handleMessageLongPress = (message: Message) => {
    if (message.sender_id !== user?.id) return;

    Alert.alert(
      'Message Options',
      '',
      [
        {
          text: 'Edit',
          onPress: () => {
            if (message.message_type === 'text') {
              setInputText(message.content);
              setEditingMessageId(message.id);
            } else {
              Alert.alert('Info', 'Only text messages can be edited');
            }
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Message',
              'Are you sure you want to delete this message?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    const { error } = await deleteMessage(message.id);
                    if (!error) {
                      setMessages(prev => prev.filter(m => m.id !== message.id));
                    } else {
                      Alert.alert('Error', 'Failed to delete message');
                    }
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleImagePress = (url: string) => {
    setSelectedImageUrl(url);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;

    return (
      <MessageBubble
        message={item}
        isMyMessage={isMyMessage}
        onLongPress={() => handleMessageLongPress(item)}
        onImagePress={handleImagePress}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat</Text>
          <Text style={styles.headerSubtitle}>User {otherUserId.substring(0, 8)}</Text>
        </View>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Options',
            '',
            [
              { text: 'Search Messages', onPress: () => Alert.alert('Coming Soon', 'Search functionality will be added soon') },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}>
          <Text style={styles.moreButton}>⋮</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        {editingMessageId && (
          <View style={styles.editingBanner}>
            <Text style={styles.editingText}>Editing message</Text>
            <TouchableOpacity onPress={() => {
              setEditingMessageId(null);
              setInputText('');
            }}>
              <Text style={styles.cancelEdit}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={() => setImagePickerVisible(true)}
          >
            <Text style={styles.attachIcon}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleFilePick}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Text style={styles.sendIcon}>{editingMessageId ? '✓' : '➤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onImageSelected={handleImageSelected}
      />

      <Modal
        visible={!!selectedImageUrl}
        transparent
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <TouchableOpacity 
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImageUrl(null)}
        >
          <Image
            source={{ uri: selectedImageUrl || '' }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    fontSize: 16,
    color: Colors.primary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  moreButton: {
    fontSize: 24,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 15,
  },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: 10,
  },
  editingText: {
    color: Colors.white,
    fontSize: 14,
  },
  cancelEdit: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  attachIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.5,
  },
  sendIcon: {
    color: Colors.white,
    fontSize: 18,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});