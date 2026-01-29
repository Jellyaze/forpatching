import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Message } from '../../types/message.types';
import { Colors } from '../../constants/Colors';
import { formatTime } from '../../utils/formatDate';

interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  onLongPress?: () => void;
  onImagePress?: (url: string) => void;
}

export default function MessageBubble({ 
  message, 
  isMyMessage, 
  onLongPress,
  onImagePress 
}: MessageBubbleProps) {
  const handleFilePress = () => {
    if (message.file_url) {
      Linking.openURL(message.file_url);
    }
  };

  const renderContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <TouchableOpacity 
            onPress={() => onImagePress?.(message.file_url || '')}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: message.file_url }}
              style={styles.imageMessage}
              resizeMode="cover"
            />
            {message.content && (
              <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'file':
        return (
          <TouchableOpacity onPress={handleFilePress} style={styles.fileContainer}>
            <Text style={styles.fileIcon}>📎</Text>
            <View style={styles.fileInfo}>
              <Text 
                style={[styles.fileName, isMyMessage ? styles.myMessageText : styles.otherMessageText]}
                numberOfLines={1}
              >
                {message.file_name || 'File'}
              </Text>
              {message.file_size && (
                <Text style={[styles.fileSize, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
                  {formatFileSize(message.file_size)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );

      case 'system':
        return (
          <Text style={styles.systemMessage}>
            {message.content}
          </Text>
        );

      default:
        return (
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
            {message.content}
          </Text>
        );
    }
  };

  if (message.message_type === 'system') {
    return (
      <View style={styles.systemContainer}>
        {renderContent()}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}
    >
      <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
        {renderContent()}
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
            {formatTime(message.created_at)}
          </Text>
          {message.is_edited && (
            <Text style={[styles.editedLabel, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
              (edited)
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 5,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 5,
  },
  otherBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.white,
  },
  otherMessageText: {
    color: Colors.text.primary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: Colors.white,
    opacity: 0.8,
  },
  otherMessageTime: {
    color: Colors.text.secondary,
  },
  editedLabel: {
    fontSize: 11,
    marginLeft: 5,
    fontStyle: 'italic',
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemMessage: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});