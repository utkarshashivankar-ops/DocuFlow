import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const toFile = (asset, fallbackName, fallbackType) => ({
  uri: asset.uri,
  name: asset.fileName || asset.name || asset.uri.split('/').pop() || fallbackName,
  type: asset.mimeType || fallbackType,
});

/** Each picker resolves to { uri, name, type } or null when the user cancels. */
export async function pickFromCamera() {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) { Alert.alert('Camera permission needed', 'Allow camera access in Settings to scan documents.'); return null; }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
  return res.canceled ? null : toFile(res.assets[0], 'scan.jpg', 'image/jpeg');
}

export async function pickFromGallery() {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
  return res.canceled ? null : toFile(res.assets[0], 'image.jpg', 'image/jpeg');
}

export async function pickFromFiles() {
  const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
  return res.canceled ? null : toFile(res.assets[0], 'document.pdf', 'application/pdf');
}
