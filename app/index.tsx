//App.js - for the mood tracker
//need to make sure this is javascript compliant
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase';


//created the moods here
const MOODS = [
    {value: 'incadescently_happy', label: 'Incadescently Happy', emoji: '🤩'},
    {value: 'quite_satisfied', label: 'Quite Satisfied', emoji: '😚'},
    {value: 'neutrally_neutral', label: 'Neutral', emoji: '😑'},
    {value: 'super_sad', label: 'Super Sad', emoji: '😢'},
    {value: 'horribly_angry', label: 'Horribly Angry', emoji: '🤬'},
    {value: 'confused', label: 'Confused', emoji:'🤔'}
];

export default function App() {
  const [items, setItems] = useState([]);
  const [sending, setSending] = useState(false);
  const moodsRef = collection(db, 'moods');

  //need to figure out what to do with data
  useEffect(() => {
    const q = query(moodsRef, orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    }, (err) => console.error(err));
    return () => unsub();
  }, []);

  //need to figure out what to do with mood
  const logMood = useCallback(async (mood) => {
    try {
      setSending(true);
      await addDoc(moodsRef, {
        mood,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not log mood.');
    } finally {
      setSending(false);
    }
  }, []);


//need to figure out what to do with item
  const renderItem = ({ item }) => {
    const ts = item.createdAt?.toDate ? item.createdAt.toDate() : null;
    const time = ts ? ts.toLocaleString() : '…';
    const moodMeta = MOODS.find(m => m.value === item.mood);
    return (
      <View style={styles.row}>
        <Text style={styles.rowEmoji}>{moodMeta?.emoji ?? '🙂'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{moodMeta?.label ?? item.mood}</Text>
          <Text style={styles.rowSub}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mood Tracker</Text>

      <View style={styles.buttons}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={styles.button}
            onPress={() => logMood(m.value)}
            disabled={sending}
          >
            <Text style={styles.buttonText}>{m.emoji} {m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {sending && <ActivityIndicator style={{ marginTop: 8 }} />}

      <Text style={styles.section}>Recent entries</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<Text style={styles.empty}>No moods yet. Tap a button above.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#101114' },
  title: { fontSize: 28, fontWeight: '700', color: 'white', marginBottom: 12, textAlign: 'center'},
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, paddingLeft: 12, paddingRight: 5},
  button: { backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  buttonText: { color: 'white', fontSize: 16 },
  section: { color: '#cbd5e1', fontWeight: '600', marginBottom: 8, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, padding: 12 },
  rowEmoji: { fontSize: 22, marginRight: 10 },
  rowTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  rowSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 32 },
});

