import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import PostCard from '../posts/PostCard';
import { Post } from '../../services/postService';
import { Colors } from '../../constants/Colors';

type LightItem = {
  id: string;
  name?: string;
  time?: string;
  date?: string;
  location?: string;
  image?: any;
  title?: string;
  image_urls?: string[];
  location_name?: string;
  date_lost_found?: string;
};

interface ItemListProps {
  data: (Post | LightItem)[];
  navigation: any;
  refreshControl?: any;
}

export default function ItemList({ data, navigation, refreshControl }: ItemListProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No items found</Text>
      </View>
    );
  }

  return (
    <FlatList
      nestedScrollEnabled
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('ViewPost', { postId: item.id })}
        />
      )}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});
