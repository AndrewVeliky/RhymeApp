import 'core-js/stable';
import React, { useEffect, useState } from 'react';
import localforage from 'localforage';
import RhymeSearchPage from './pages/RhymeSearchPage';
import AddRhymePage from './pages/AddRhymePage';
import jsonData from './assets/merged.json';

type WordData = {
  word: string;
  partOfSpeech: string;
  gender: string;
  manys: string;
};

// Ініціалізація бази даних у IndexedDB
const initializeDatabase = async () => {
  try {
    const stored = await localforage.getItem('initialized');
    if (!stored) {
      for (const [index, item] of Object.entries(
        jsonData as Record<string, WordData>,
      )) {
        await localforage.setItem(item.word.toLowerCase(), item);
      }
      await localforage.setItem('initialized', true);
      console.log('Дані з JSON успішно збережено у IndexedDB');
    }
  } catch (error) {
    console.error('Помилка ініціалізації бази даних:', error);
  }
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'search' | 'add'>('search');

  useEffect(() => {
    initializeDatabase();
  }, []);

  const renderPage = () => {
    if (currentPage === 'search') {
      return <RhymeSearchPage />;
    }
    if (currentPage === 'add') {
      return <AddRhymePage />;
    }
  };

  return (
    <div>
      <header
        style={{
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <button onClick={() => setCurrentPage('search')}>Пошук рим</button>
        <button onClick={() => setCurrentPage('add')}>Додавання рими</button>
      </header>
      <main style={{ padding: '2rem' }}>{renderPage()}</main>
    </div>
  );
};

export default App;
