import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';
import React, { useMemo } from 'react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEmotion } from '../../context/EmotionContext';

export default function TabTwoScreen() {
  const { emotionList } = useEmotion();
  const textEmotionsList = ["Angry", "Disgusted", "Fearful", "Happy", "Neutral", "Sad", "Surprised"]
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#FFAA33', '#33FFAA']; // Added two more colors
  
  const emotionColorMap = useMemo(() => {
    const map = new Map();
    textEmotionsList.forEach((emotion, index) => {
      map.set(emotion, colors[index % colors.length]);
    });
    return map;
  }, [textEmotionsList]);

  const getColorForEmotion = (emotionStr) => {
    for (const [emotion, color] of emotionColorMap.entries()) {
      if (emotionStr.includes(emotion)) {
        return color;
      }
    }
    return '#000000'; 
  };
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="list" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Emo</ThemedText>
      </ThemedView>
      {emotionList.map((emotion) => {
        const parsedEmotion = JSON.parse(emotion);
        const generatedText = parsedEmotion.generated_text;
        const timestamp = new Date(parsedEmotion.timestamp).toLocaleString();

        return (
          <ThemedText key={generatedText} style={{ color: getColorForEmotion(generatedText) }}>
            {generatedText} - {timestamp}
          </ThemedText>
        );
      })}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
