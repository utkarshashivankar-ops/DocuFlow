
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Input from '../components/Input';
import { CATEGORIES } from '../constants/categories';
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '../constants/config';
import { colors } from '../constants/theme';
import { documentService, uploadDocument } from '../services/documentService';
import { getErrorMessage } from '../utils/errors';
import { formatDate } from '../utils/date';

const STEPS = [
  'Uploading',
  'Processing',
  'Extracting text',
  'Classifying',
  'Completed',
];

const STAGE_INDEX = {
  uploading: 0,
  processing: 1,
  extracting: 2,
  classifying: 3,
  completed: 4,
};

function Progress({ stage, failed }) {
  return (
    <Card style={{ marginTop: 16 }}>
      {STEPS.map((label, index) => {
        const done = stage > index || stage === 4;
        const active = !failed && stage === index && stage < 4;
        const isFail = failed && stage === index;

        const icon = isFail
          ? 'close-circle'
          : done
            ? 'checkmark-circle'
            : active
              ? 'ellipsis-horizontal-circle'
              : 'ellipse-outline';

        const color = isFail
          ? colors.danger
          : done
            ? colors.success
            : active
              ? colors.primary
              : colors.muted;

        return (
          <View key={label} style={styles.step}>
            <Ionicons name={icon} size={22} color={color} />
            <Text
              style={[
                styles.stepText,
                (active || done) && {
                  color: colors.text,
                  fontWeight: '600',
                },
                isFail && { color: colors.danger },
              ]}
            >
              {label}{active ? '…' : ''}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

export default function AddDocumentScreen({ navigation }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Auto');
  const [phase, setPhase] = useState('pick');
  const [stage, setStage] = useState(0);
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);

  const poll = useRef(null);
  const alive = useRef(true);

  const stopPolling = useCallback(() => {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  }, []);

  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setFile(null);
    setTitle('');
    setCategory('Auto');
    setPhase('pick');
    setStage(0);
    setDoc(null);
    setError(null);
  }, [stopPolling]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (phase === 'done' || phase === 'failed') {
          reset();
        }
      };
    }, [phase, reset])
  );

  const setPicked = useCallback((asset, fallbackName, fallbackType) => {
    if (!asset?.uri) {
      Alert.alert(
        'Invalid file',
        'The selected file URI is unavailable. Please select it again.'
      );
      return;
    }

    const uriName = asset.uri.split('/').pop()?.split('?')[0];

    const name =
      asset.name ||
      asset.fileName ||
      uriName ||
      fallbackName;

    const type =
      asset.mimeType ||
      (name.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : fallbackType);

    setFile({
      uri: asset.uri,
      name,
      type,
      size: asset.size,
    });

    setError(null);
  }, []);

  const takePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Camera permission needed',
          'Allow camera access in Settings to scan documents.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length) {
        setPicked(result.assets[0], 'scan.jpg', 'image/jpeg');
      }
    } catch (err) {
      Alert.alert(
        'Camera error',
        err?.message || 'Could not open the camera.'
      );
    }
  };

  const pickGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length) {
        setPicked(result.assets[0], 'image.jpg', 'image/jpeg');
      }
    } catch (err) {
      Alert.alert(
        'Gallery error',
        err?.message || 'Could not open the gallery.'
      );
    }
  };

  const pickFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: false, // true se false kiya
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];

    if (!asset.uri) {
      throw new Error('The selected file does not have a valid URI.');
    }

    setPicked(asset, 'document.pdf', 'application/pdf');

    console.log('[DocuFlow] Selected file:', {
      name: asset.name,
      type: asset.mimeType,
      size: asset.size,
      uri: asset.uri,
     });
   } catch (err) {
    console.error('[DocuFlow] File picker error:', err);

    Alert.alert(
      'File selection error',
      err?.message || 'Could not select the file.'
     );
   }
 };

  const startPolling = useCallback(
    (id) => {
      stopPolling();

      const startedAt = Date.now();

      poll.current = setInterval(async () => {
        if (!alive.current) {
          stopPolling();
          return;
        }

        try {
          const result = await documentService.get(id);

          if (!alive.current) return;

          setDoc(result);

          if (result.processingStatus === 'completed') {
            stopPolling();
            setStage(4);
            setPhase('done');
            return;
          }

          if (result.processingStatus === 'failed') {
            stopPolling();
            setError(
              result.processingError || 'Document processing failed.'
            );
            setPhase('failed');
            return;
          }

          setStage(STAGE_INDEX[result.processingStatus] ?? 1);
        } catch (err) {
          console.warn(
            '[DocuFlow] Temporary processing status error:',
            err?.message
          );
        }

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stopPolling();

          if (alive.current) {
            setError(
              'Processing is taking longer than expected. ' +
              'Check your document again shortly.'
            );
            setPhase('failed');
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  const submit = async () => {
    if (!file?.uri) {
      Alert.alert(
        'Select a file',
        'Please select a PDF or image before uploading.'
      );
      return;
    }

    if (phase === 'uploading' || phase === 'processing') {
      return;
    }

    setError(null);
    setPhase('uploading');
    setStage(0);

    try {
      const created = await uploadDocument(file, {
        title: title.trim() || undefined,
        category: category === 'Auto' ? undefined : category,
      });

      if (!alive.current) return;

      setDoc(created);

      if (created.processingStatus === 'completed') {
        setStage(4);
        setPhase('done');
        return;
      }

      if (created.processingStatus === 'failed') {
        setStage(STAGE_INDEX[created.processingStatus] ?? 1);
        setError(
          created.processingError || 'Document processing failed.'
        );
        setPhase('failed');
        return;
      }

      setPhase('processing');
      setStage(STAGE_INDEX[created.processingStatus] ?? 1);
      startPolling(created.id);
    } catch (err) {
      console.error('[DocuFlow] Upload failed:', {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        response: err?.response?.data,
        fileName: file?.name,
        fileUri: file?.uri,
      });

      if (!alive.current) return;

      setError(getErrorMessage(err, 'Upload failed. Please try again.'));
      setPhase('pick');

      Alert.alert(
        'Upload failed',
        getErrorMessage(err, 'Please select the file again and retry.')
      );
    }
  };

  const isImage = Boolean(file?.type?.startsWith('image/'));
  const working = phase === 'uploading' || phase === 'processing';

  return (
    <Screen
      title="Add document"
      subtitle="Scan or upload — we read it for you"
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {phase === 'pick' && !file ? (
        <>
          <Button
            title="Scan with camera"
            icon="camera-outline"
            onPress={takePhoto}
          />

          <Button
            title="Choose from gallery"
            icon="images-outline"
            variant="secondary"
            onPress={pickGallery}
            style={{ marginTop: 10 }}
          />

          <Button
            title="Upload PDF / file"
            icon="document-attach-outline"
            variant="outline"
            onPress={pickFile}
            style={{ marginTop: 10 }}
          />

          <Text style={styles.note}>
            Supported: JPG, PNG, WEBP and PDF up to 10 MB.
            For best results, photograph the document flat, in good light.
          </Text>
        </>
      ) : null}

      {file ? (
        <>
          <Card style={{ alignItems: 'center', padding: 12 }}>
            {isImage ? (
              <Image
                source={{ uri: file.uri }}
                style={styles.preview}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.pdf}>
                <Ionicons
                  name="document-text"
                  size={48}
                  color={colors.primary}
                />
                <Text style={styles.pdfName} numberOfLines={2}>
                  {file.name}
                </Text>
                {file.size != null ? (
                  <Text style={styles.fileSize}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                ) : null}
              </View>
            )}
          </Card>

          {phase === 'pick' ? (
            <>
              <Input
                label="Title (optional)"
                value={title}
                onChangeText={setTitle}
                placeholder="Leave empty to name it automatically"
                autoCapitalize="sentences"
                style={{ marginTop: 16 }}
              />

              <Text style={styles.label}>Category</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {['Auto', ...CATEGORIES.map((item) => item.key)].map(
                  (item) => (
                    <Chip
                      key={item}
                      label={item === 'Auto' ? 'Auto-detect' : item}
                      active={category === item}
                      onPress={() => setCategory(item)}
                    />
                  )
                )}
              </ScrollView>

              <Button
                title="Upload & process"
                icon="cloud-upload-outline"
                onPress={submit}
              />

              <Button
                title="Choose a different file"
                variant="ghost"
                onPress={reset}
                style={{ marginTop: 6 }}
              />
            </>
          ) : null}
        </>
      ) : null}

      {phase !== 'pick' ? (
        <Progress stage={stage} failed={phase === 'failed'} />
      ) : null}

      {working ? (
        <Text style={styles.note}>
          Please keep the app open while we read your document.
        </Text>
      ) : null}

      {phase === 'done' && doc ? (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.doneTitle}>{doc.title}</Text>
          <Text style={styles.line}>Type: {doc.documentType}</Text>
          <Text style={styles.line}>Category: {doc.category}</Text>
          <Text style={styles.line}>
            Expiry:{' '}
            {doc.expiryDate
              ? formatDate(doc.expiryDate)
              : 'Not found in document'}
          </Text>

          <Button
            title="View document"
            onPress={() => {
              const id = doc.id;
              reset();
              navigation.navigate('DocumentDetail', { id });
            }}
            style={{ marginTop: 14 }}
          />

          <Button
            title="Add another"
            variant="ghost"
            onPress={reset}
            style={{ marginTop: 6 }}
          />
        </Card>
      ) : null}

      {phase === 'failed' && doc ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.note}>
            Your file was saved. You can review it and fill in the details
            manually, or retry from the document page.
          </Text>

          <Button
            title="Open document"
            onPress={() => {
              const id = doc.id;
              reset();
              navigation.navigate('DocumentDetail', { id });
            }}
            style={{ marginTop: 10 }}
          />

          <Button
            title="Add another"
            variant="ghost"
            onPress={reset}
            style={{ marginTop: 6 }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    backgroundColor: '#FEE2E2',
    color: colors.danger,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 13,
  },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: 8,
  },
  pdf: {
    alignItems: 'center',
    padding: 24,
  },
  pdfName: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fileSize: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  stepText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.muted,
  },
  doneTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  line: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
