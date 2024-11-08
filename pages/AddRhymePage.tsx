// AddRhymePage.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'rhymeDB', location: 'default' });

const initializeCustomRhymesTable = async () => {
  (await db).transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS CustomRhymes (id INTEGER PRIMARY KEY NOT NULL, word TEXT, partOfSpeech TEXT, gender TEXT, manys TEXT, rhymes TEXT);',
    );
  });
};

const addRhymeToDatabase = async (
  word: string,
  partOfSpeech: string,
  gender: string,
  manys: string,
  rhyme: string,
) => {
  const normalizedWord = word.toLowerCase();

  return new Promise(async (resolve, reject) => {
    (await db).transaction(tx => {
      tx.executeSql(
        'SELECT * FROM CustomRhymes WHERE word = ? LIMIT 1;',
        [normalizedWord],
        async (_, result) => {
          if (result.rows.length > 0) {
            // Якщо слово вже є в базі, перевіряємо рими
            const item = result.rows.item(0);
            const existingRhymes = item.rhymes ? item.rhymes.split(',') : [];

            if (existingRhymes.includes(rhyme)) {
              Alert.alert('Рима вже існує для цього слова');
              resolve(false);
            } else {
              const updatedRhymes = [...existingRhymes, rhyme].join(',');
              tx.executeSql(
                'UPDATE CustomRhymes SET rhymes = ? WHERE word = ?;',
                [updatedRhymes, normalizedWord],
                () => {
                  Alert.alert('Рима додана успішно');
                  resolve(true);
                },
                (_, error) => reject(error),
              );
            }
          } else {
            // Додаємо новий запис
            tx.executeSql(
              'INSERT INTO CustomRhymes (word, partOfSpeech, gender, manys, rhymes) VALUES (?, ?, ?, ?, ?);',
              [normalizedWord, partOfSpeech, gender, manys, rhyme],
              () => {
                Alert.alert('Слово та рима додані успішно');
                resolve(true);
              },
              (_, error) => reject(error),
            );
          }
        },
        (_, error) => reject(error),
      );
    });
  });
};

const AddRhymePage: React.FC = () => {
  const [word, setWord] = useState('');
  const [rhyme, setRhyme] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [gender, setGender] = useState('');
  const [manys, setManys] = useState('');

  const handleAddRhyme = async () => {
    if (!word || !rhyme) {
      Alert.alert('Будь ласка, заповніть всі поля');
      return;
    }

    await initializeCustomRhymesTable();

    await addRhymeToDatabase(word, partOfSpeech, gender, manys, rhyme);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Додати власну риму</Text>
      <TextInput
        style={styles.input}
        placeholder="Слово"
        value={word}
        onChangeText={setWord}
      />
      <TextInput
        style={styles.input}
        placeholder="Рима"
        value={rhyme}
        onChangeText={setRhyme}
      />
      <TextInput
        style={styles.input}
        placeholder="Частина мови"
        value={partOfSpeech}
        onChangeText={setPartOfSpeech}
      />
      <TextInput
        style={styles.input}
        placeholder="Рід (ч/ж/с)"
        value={gender}
        onChangeText={setGender}
      />
      <TextInput
        style={styles.input}
        placeholder="Множина"
        value={manys}
        onChangeText={setManys}
      />
      <Button title="Внести в базу рим" onPress={handleAddRhyme} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default AddRhymePage;
