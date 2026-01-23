import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { uploadImage } from '../../services/authService';

export default function EditProfileScreen({ navigation }) {
  const { user, profile, updateProfile } = useAuth();

  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [contactNumber, setContactNumber] = useState('');
  const [label, setLabel] = useState('Student');

  const [newPhoto, setNewPhoto] = useState(null);

  useEffect(() => {
    if (profile) {
      setName(profile?.name || '');
      setAge(profile?.age ? String(profile.age) : '');
      setGender(profile?.gender || 'Male');
      setContactNumber(profile?.contact_number || '');
      setLabel(profile?.label || 'Student');
    }
  }, [profile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPhoto(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    if (!name.trim() || !age || !contactNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = profile?.photo_url || null;

      // upload image to Supabase storage if changed
      if (newPhoto) {
        const uploaded = await uploadImage(newPhoto, 'profile', user.id);
        if (!uploaded) {
          throw new Error('Failed to upload profile photo');
        }
        photoUrl = uploaded;
      }

      const updates = {
        name: name.trim(),
        age: parseInt(age),
        gender,
        contact_number: contactNumber.trim(),
        label,
        photo_url: photoUrl,
      };

      const result = await updateProfile(updates);

      if (result?.error) {
        console.log('updateProfile error:', result.error);
        throw new Error(result.error.message || 'Update failed');
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#50A296" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
          <Image
            source={{
              uri:
                newPhoto ||
                profile?.photo_url ||
                'https://via.placeholder.com/120',
            }}
            style={styles.profilePhoto}
          />
          <View style={styles.editPhotoOverlay}>
            <Text style={styles.editPhotoText}>Change Photo</Text>
          </View>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Age *"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <View style={styles.pickerContainer}>
          <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker}>
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Contact Number *"
          value={contactNumber}
          onChangeText={setContactNumber}
          keyboardType="phone-pad"
        />

        <View style={styles.pickerContainer}>
          <Picker selectedValue={label} onValueChange={setLabel} style={styles.picker}>
            <Picker.Item label="Student" value="Student" />
            <Picker.Item label="Civilian" value="Civilian" />
            <Picker.Item label="Blue-collar" value="Blue-collar" />
            <Picker.Item label="White-collar" value="White-collar" />
            <Picker.Item label="Official" value="Official" />
          </Picker>
        </View>

        <TouchableOpacity
          onPress={handleUpdate}
          style={styles.updateButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.updateButtonText}>UPDATE PROFILE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D0E1D7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#50A296',
  },
  headerButton: { color: 'white', fontSize: 16 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, alignItems: 'center' },
  photoContainer: { position: 'relative', marginBottom: 30 },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#50A296',
    backgroundColor: '#eee',
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  editPhotoText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: { height: 50 },
  updateButton: {
    width: '100%',
    backgroundColor: '#50A296',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
