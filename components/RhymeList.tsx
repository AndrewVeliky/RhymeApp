import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RhymeItem } from '../pages/utils';

type RhymeListProps = {
  rhymesData: RhymeItem[];
};

const RhymeList: React.FC<RhymeListProps> = ({ rhymesData }) => {
  // Групуємо рими за частиною мови
  const groupedRhymes = rhymesData.reduce<{ [key: string]: string[] }>(
    (acc, rhyme) => {
      const partOfSpeech = rhyme.partOfSpeech || 'Невідомо';
      if (!acc[partOfSpeech]) {
        acc[partOfSpeech] = [];
      }
      acc[partOfSpeech].push(rhyme.word);
      return acc;
    },
    {},
  );

  return (
    <View style={styles.container}>
      {Object.keys(groupedRhymes).map(partOfSpeech => (
        <View key={partOfSpeech} style={styles.rhymeGroup}>
          <Text style={styles.partOfSpeech}>{partOfSpeech}</Text>
          <Text style={styles.rhymeWords}>
            {groupedRhymes[partOfSpeech].join(', ')}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  rhymeGroup: { marginBottom: 15 },
  partOfSpeech: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  rhymeWords: { fontSize: 16, color: '#555', marginTop: 5 },
});

export default RhymeList;
