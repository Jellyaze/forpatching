import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import PrimaryButton from '../../components/ui/PrimaryButton';

export default function ProfileDetailsScreen({ navigation }: any) {
  const auth = useAuth() as any;
  const { user, profile, updateProfile } = auth;

  const [loading, setLoading] = useState(false);

  const [profileImage, setProfileImage] = useState<string | null>(profile?.photo_url || null);
  const [fullName, setFullName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [contactNumber, setContactNumber] = useState(profile?.contact_number || '');

  const [labelOpen, setLabelOpen] = useState(false);
  const [label, setLabel] = useState<string | null>(profile?.label || null);
  const [labelItems] = useState([
    { label: 'Student', value: 'Student' },
    { label: 'Civilian', value: 'Civilian' },
    { label: 'Blue-collar', value: 'Blue-collar' },
    { label: 'White-collar', value: 'White-collar' },
    { label: 'Official', value: 'Official' },
  ]);

  const [genderOpen, setGenderOpen] = useState(false);
  const [gender, setGender] = useState<string | null>(profile?.gender || null);
  const [genderItems] = useState([
    { label: 'Female', value: 'Female' },
    { label: 'Male', value: 'Male' },
    { label: 'Prefer not to say', value: 'Prefer not to say' },
    { label: 'Other', value: 'Other' },
  ]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!label) {
      Alert.alert('Error', 'Please select your role');
      return;
    }

    if (!age || parseInt(age) < 1) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert('Error', 'Please enter your contact number');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    setLoading(true);

    const { error } = await updateProfile({
      name: fullName.trim(),
      label,
      age: parseInt(age),
      gender,
      contact_number: contactNumber.trim(),
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileImageContainer}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require('../../assets/proflogo.png')
            }
            style={styles.profileImage}
          />
        </View>

        <TouchableOpacity onPress={pickImage} style={styles.replacePhotoButton}>
          <Text style={styles.replacePhotoText}>Replace Photo</Text>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Label / Role</Text>
          <View style={styles.dropdownWrapper}>
            <DropDownPicker
              open={labelOpen}
              value={label}
              items={labelItems}
              setOpen={setLabelOpen}
              setValue={setLabel}
              placeholder="Select Role"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Age"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.dropdownWrapper}>
            <DropDownPicker
              open={genderOpen}
              value={gender}
              items={genderItems}
              setOpen={setGenderOpen}
              setValue={setGender}
              placeholder="Select Gender"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
          </View>

          <Text style={styles.label}>Contact No.</Text>
          <TextInput
            style={styles.input}
            value={contactNumber}
            onChangeText={setContactNumber}
            placeholder="Contact Number"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Identification</Text>
          <TextInput style={styles.input} placeholder="ID Number (Optional)" editable={false} />

          <PrimaryButton title="Save" onPress={handleSave} loading={loading} style={styles.saveButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: { fontSize: 16, color: Colors.primary },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text.primary },
  scrollContent: { padding: 20 },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 15,
  },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  replacePhotoButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 10,
    marginBottom: 30,
  },
  replacePhotoText: { color: Colors.primary, fontWeight: 'bold' },
  formContainer: { backgroundColor: Colors.white, borderRadius: 10, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, backgroundColor: Colors.white },
  dropdownWrapper: { zIndex: 1000, marginBottom: 10 },
  dropdown: { borderColor: Colors.border },
  dropdownContainer: { borderColor: Colors.border },
  saveButton: { marginTop: 30 },
});
