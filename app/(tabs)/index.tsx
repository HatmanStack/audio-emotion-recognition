import { Image,Button, TextInput, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Audio } from 'expo-av';
import { useEmotion } from '../../context/EmotionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AWS from 'aws-sdk';

import * as FileSystem from 'expo-file-system';

export default function HomeScreen() {
  const [response, setResponse] = useState('');
  const [recordingURI, setRecordingURI] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const { setEmotionList, emotionList } = useEmotion();

  const startRecording = async () => {
    try {
      // Request permissions if needed
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access microphone is required!');
        return;
      }

      // Create a new recording instance
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at:', uri);
        setRecording(null);
        setIsRecording(false);
        console.log(uri)
        const base64_file = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setRecordingURI(base64_file)
        
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const callLambda = async () => {
      setIsCalling(true);
      let audioInclude = "no"
      if (recordingURI.length > 1){
        audioInclude = "true"
      }
      console.log(response);
      const data = {
        audio_included: audioInclude,
        audio: recordingURI,
        prompt: response
      };
    const serializedData = JSON.stringify(data);
    const awsId = process.env.EXPO_PUBLIC_AWS_ID;
    const awsSecret = process.env.EXPO_PUBLIC_AWS_SECRET;
    const awsRegion = process.env.EXPO_PUBLIC_AWS_REGION;
    try {
      const lambda = new AWS.Lambda({
        accessKeyId: awsId,
        secretAccessKey: awsSecret,
        region: awsRegion,
      });
      const params = {
        FunctionName: 'audio-test',
        InvocationType: 'RequestResponse',
        Payload: serializedData,
      };
      lambda.invoke(params, (err, data) => {
        if (err) {
          console.error(`An error occurred: ${err}`);
        } else {
          const responsePayload = JSON.parse(data.Payload);
          const parsedBody = JSON.parse(responsePayload.body);
          parsedBody[0].timestamp = new Date().toISOString();
          setEmotionList(prevEmotionList => [JSON.stringify(parsedBody[0]),...prevEmotionList]);
          console.log(responsePayload);
        }
      });
    } catch (e) {
      console.error(`An error occurred: ${e}`);
    }
    setIsCalling(false);
  }

  useEffect(() => {
    const loadEmotionList = async () => {
      try {
        const storedEmotionList = await AsyncStorage.getItem('emotionList');
        if (storedEmotionList) {
          const parsedEmotionList = JSON.parse(storedEmotionList);
          const reversedEmotionList = parsedEmotionList.reverse();
          console.log('Loaded and reversed emotion list:', reversedEmotionList);
          setEmotionList(reversedEmotionList);
        }
      } catch (error) {
        console.error('Failed to load emotion list:', error);
      }
    };

    loadEmotionList();
  }, []);

  useEffect(() => {
    const saveEmotionList = async () => {
      try {
        console.log('Saving emotion list:', emotionList);
        await AsyncStorage.setItem('emotionList', JSON.stringify(emotionList));
      } catch (error) {
        console.error('Failed to save emotion list:', error);
      }
    };

    saveEmotionList();
  }, [emotionList]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Hey! How are you?</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Something Wrong? Tell me about it.</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Button title="Activate Microphone" onPress={isRecording ? stopRecording : startRecording} />
        {isRecording && <ThemedText>Recording...</ThemedText>}
        <TextInput
          style={styles.input}
          placeholder="Type your response"
          value={response}
          onChangeText={setResponse}
        />
        <Button title="Submit" onPress={callLambda} disabled={isCalling} />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
  },
});
