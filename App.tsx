import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { v4 as uuidv4 } from 'uuid';


function CoursePicker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: any) => void;
  options: string[];
}) {
  if (Platform.OS === 'web') {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEE', marginBottom: 12 }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Picker selectedValue={value} onValueChange={v => onChange(v)}>
      {options.map(opt => (
        <Picker.Item key={opt} label={opt} value={opt} />
      ))}
    </Picker>
  );
}

type Course = 'Starter' | 'Main' | 'Dessert';
interface MenuItem {
  id: string;
  name: string;
  description: string;
  course: Course;
  price: number;
}

export default function App() {
  const [screen, setScreen] = useState<'home' | 'add' | 'filter'>('home');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState<Course>('Starter');
  const [priceText, setPriceText] = useState('');
  const [filter, setFilter] = useState<'All' | Course>('All');
  const flash = useRef(new Animated.Value(0)).current;

  function animateFlash() {
    flash.setValue(0);
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }

  const avgByCourse = useMemo(() => {
    const sums: Record<Course, number> = { Starter: 0, Main: 0, Dessert: 0 };
    const counts: Record<Course, number> = { Starter: 0, Main: 0, Dessert: 0 };

    menuItems.forEach((item) => {
      sums[item.course] += item.price;
      counts[item.course] += 1;
    });

    const avg: Record<Course, number> = {
      Starter: counts.Starter ? sums.Starter / counts.Starter : 0,
      Main: counts.Main ? sums.Main / counts.Main : 0,
      Dessert: counts.Dessert ? sums.Dessert / counts.Dessert : 0,
    };
    return avg;
  }, [menuItems]);

  useEffect(() => {
    if (menuItems.length > 0) animateFlash();
  }, [menuItems]);

  function addItem() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a dish name.');
      return;
    }
    if (!priceText.trim() || isNaN(Number(priceText))) {
      Alert.alert('Validation', 'Please enter a valid price.');
      return;
    }

    const newItem: MenuItem = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      course,
      price: Number(priceText),
    };

    setMenuItems((prev) => [...prev, newItem]);
    setName('');
    setDescription('');
    setPriceText('');
    setCourse('Starter');

    Alert.alert('Success', 'Menu item added successfully!');
    setScreen('home');
  }

  function removeItem(id: string) {
    Alert.alert('Remove Item', 'Are you sure you want to delete this dish?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setMenuItems((prev) => prev.filter((i) => i.id !== id)),
      },
    ]);
  }

  const filteredItems = useMemo(() => {
    if (filter === 'All') return menuItems;
    return menuItems.filter((i) => i.course === filter);
  }, [menuItems, filter]);

  function HeaderBar({ title }: { title: string }) {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setScreen('home')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('add')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('filter')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function HomeScreen() {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderBar title="Christoffel’s Menu" />

        <Animated.View
          style={[
            styles.flash,
            { opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }) },
          ]}
        >
          <Text style={styles.flashText}>Menu Updated!</Text>
        </Animated.View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Average Prices:</Text>
          <Text style={styles.summaryText}>Starters: R{avgByCourse.Starter.toFixed(2)}</Text>
          <Text style={styles.summaryText}>Mains: R{avgByCourse.Main.toFixed(2)}</Text>
          <Text style={styles.summaryText}>Desserts: R{avgByCourse.Dessert.toFixed(2)}</Text>
        </View>

        <FlatList
          data={menuItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardPrice}>R{item.price.toFixed(2)}</Text>
              </View>
              <Text style={styles.cardDesc}>{item.description || 'No description'}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardCourse}>{item.course}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ color: '#777' }}>No menu items yet. Add some dishes!</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  function AddScreen() {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderBar title="Add Menu Item" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.label}>Dish Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="e.g. Lemon Chicken"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 80 }]}
              placeholder="Short description"
              multiline
            />

            <Text style={styles.label}>Course</Text>
            <View style={styles.pickerBox}>
              <CoursePicker value={course} onChange={setCourse} options={['Starter', 'Main', 'Dessert']} />
            </View>

            <Text style={styles.label}>Price (R)</Text>
            <TextInput
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="numeric"
              style={styles.input}
              placeholder="e.g. 120.00"
            />

            <TouchableOpacity onPress={addItem} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save Dish</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  function FilterScreen() {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderBar title="Filter Menu" />

        <View style={{ padding: 12 }}>
          <Text style={styles.label}>Select Course</Text>
          <View style={styles.pickerBox}>
            <CoursePicker value={filter} onChange={setFilter} options={['All', 'Starter', 'Main', 'Dessert']} />
          </View>
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <Text style={styles.cardCourse}>{item.course} - R{item.price.toFixed(2)}</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: '#777' }}>No dishes for this course.</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return screen === 'home' ? (
    <HomeScreen />
  ) : screen === 'add' ? (
    <AddScreen />
  ) : (
    <FilterScreen />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F8' },
  header: {
    backgroundColor: '#fff',
    padding: 14,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F3B38', textAlign: 'center' },
  headerButtons: { position: 'absolute', right: 10, top: 10, flexDirection: 'row' },
  headerBtn: {
    backgroundColor: '#E9F3F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 5,
  },
  headerBtnText: { color: '#2E4D46', fontWeight: '600' },

  flash: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: '#7BA6A1',
    padding: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  flashText: { color: '#fff', fontWeight: '700' },

  summaryBox: {
    margin: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, color: '#2E4D46' },
  summaryText: { fontSize: 14, marginVertical: 2, color: '#444' },

  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F3B38' },
  cardPrice: { color: '#1F3B38', fontWeight: '700' },
  cardDesc: { marginTop: 4, color: '#666' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cardCourse: { fontWeight: '600', color: '#2E4D46' },
  removeText: { color: '#B00020', fontWeight: '700' },

  label: { fontWeight: '600', color: '#2E4D46', marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  pickerBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#7BA6A1',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
});