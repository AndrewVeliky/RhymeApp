import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RhymeList from '../components/RhymeList';
import {
  findDictionaryRhymes,
  findIndirectRhymes,
  findPhoneticRhymes,
  RhymeItem,
  findCustomRhymes,
} from './utils';

import { useNavigation, DrawerActions } from '@react-navigation/native';

const RhymeSearchPage: React.FC = () => {
  const [word, setWord] = useState<string>('');
  const [dictionaryRhymes, setDictionaryRhymes] = useState<RhymeItem[]>([]);
  const [phoneticRhymes, setPhoneticRhymes] = useState<RhymeItem[]>([]);
  const [indirectRhymes, setIndirectRhymes] = useState<RhymeItem[]>([]);
  const [customRhymes, setCustomRhymes] = useState<RhymeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();

  const handleSearch = async () => {
    if (!word.trim()) {
      setError('Будь ласка, введіть слово для пошуку.');
      return;
    }

    await setLoading(true);
    await setError(null);

    // Виконуємо пошук рим
    const dictionaryResults = await findDictionaryRhymes(word);
    const phoneticResults = await findPhoneticRhymes(word);
    const indirectResults = await findIndirectRhymes(word);
    const customResults = await findCustomRhymes(word);

    console.log('dictionaryResults', dictionaryResults);

    await setDictionaryRhymes(await dictionaryResults);
    await setPhoneticRhymes(await phoneticResults);
    await setIndirectRhymes(await indirectResults);
    await setCustomRhymes(await customResults);
    await setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Іконка для відкриття меню */}
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={styles.menuButton}
      >
        <Icon name="menu" size={30} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Пошук рим</Text>

      <TextInput
        style={styles.input}
        placeholder="Введіть слово"
        value={word}
        onChangeText={text => {
          setWord(text);
          setError(null); // Скидаємо помилку при зміні тексту
        }}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button title="Знайти рими" onPress={handleSearch} />

      {loading && (
        <ActivityIndicator
          style={styles.loading}
          size="large"
          color="#0000ff"
        />
      )}

      {!loading &&
        !dictionaryRhymes.length &&
        !phoneticRhymes.length &&
        !customRhymes.length &&
        !indirectRhymes.length &&
        word && <Text style={styles.noResultsText}>Рими не знайдено.</Text>}

      {/* Список власних рим */}
      {customRhymes.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Власні рими</Text>
          <RhymeList rhymesData={customRhymes} />
        </>
      )}

      {/* Список словникових рим */}
      {dictionaryRhymes.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Словникові рими</Text>
          <RhymeList rhymesData={dictionaryRhymes} />
        </>
      )}

      {/* Список фонетичних рим */}
      {phoneticRhymes.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Фонетичні рими</Text>
          <RhymeList rhymesData={phoneticRhymes} />
        </>
      )}

      {/* Список непрямих рим */}
      {indirectRhymes.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Непрямі рими</Text>
          <RhymeList rhymesData={phoneticRhymes} />
        </>
      )}
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
  loading: { marginVertical: 20 },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
  noResultsText: {
    color: '#777',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  menuButton: { position: 'absolute', top: 40, left: 10 },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
});

export default RhymeSearchPage;
