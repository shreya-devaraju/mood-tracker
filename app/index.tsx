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
  Timestamp,
  where
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { db } from '../firebase';
//New: for sign-up, sign-in, and authentication
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [items, setItems] = useState<ItemType[]>([]);
  const [sending, setSending] = useState(false);

  //consts for authnetication logic
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  //all use effects:
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); //is user is signedout, user will be null
      if (!user) setItems([]);
    });
    return unsubscribe
  }, []);


  useEffect(() => {
    if (!user) return;
    const moodsRef = collection(db, 'moods')
    const q = query(moodsRef, where("uid", "==", user.uid), orderBy('createdAt', 'desc'), limit(20));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => { 
        const d = doc.data();
        return {
          id: doc.id,
          mood: d.mood,
          data: '', 
          createdAt: d.createdAt ?? null,
        } as ItemType;
      });
      setItems(data);;

    });

    return () => unsub();
  }, [user]);

  const logMood = useCallback(async (mood: string) => {
    if (!user) return;
    try {
      setSending(true);
      await addDoc(collection(db, 'moods'), {
        mood,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not log mood.');
    } finally {
      setSending(false);
    }
  }, [user]);

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      Alert.alert('Sign Up Error', e.message);
    }
  };
  
  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      Alert.alert('Sign In Error', e.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      Alert.alert('Sign Out Error', e.message);
    }
  };



  //Timestamp -> what we recieve from Firestore
  type ItemType = {id: string; mood: string; data: string, createdAt?: Timestamp | null};


//--Fixed Item
  const renderItem = ({ item }: {item: ItemType}) => {
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


  //When the user is not logged in this should show up instead:
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Mood Tracker</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          placeholderTextColor="#999" 
          value={email} 
          onChangeText={setEmail}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          placeholderTextColor="#999" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }


//When the user is signed in this will show up instead
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome, {user.email}</Text>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>

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
  signOutButton: { backgroundColor: '#b91c1c', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 16 },
  buttonText: { color: 'white', fontSize: 16 },
  section: { color: '#cbd5e1', fontWeight: '600', marginBottom: 8, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, padding: 12 },
  rowEmoji: { fontSize: 22, marginRight: 10 },
  rowTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  rowSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 32 },
  input: {height: 48, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, backgroundColor: '#fff', fontSize: 16}
});

