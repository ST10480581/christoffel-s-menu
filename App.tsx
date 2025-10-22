import React, { useMemo, useRef, useState } from 'react';
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

/** Types */
type Course = 'Starter' | 'Main' | 'Dessert';
interface MenuItem {
  id: string;
  name: string;
  description: string;
  course: Course;
  price: number;
}

/** App */
export default function App() {
  // "Navigation" state: 'home' | 'add' | 'filter'
  const [screen, setScreen] = useState<'home' | 'add' | 'filter'>('home');

  // Menu items stored in-memory (not persistent) as required
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Form states for add screen
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState<Course>('Starter');
  const [priceText, setPriceText] = useState(''); // keep as string for TextInput

  // Filter state
  const [filter, setFilter] = useState<'All' | Course>('All');

  // Simple animation when menu updates
  const flash = useRef(new Animated.Value(0)).current;
  function animateFlash() {
    flash.setValue(0);
    Animated.timing(flash, { toValue: 1, duration: 700, useNativeDriver: true }).start(() => {
      Animated.timing(flash, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    });
  }

  // Compute totals and averages
  const total = menuItems.length;
  const avgByCourse = useMemo(() => {
    const courses: Course[] = ['Starter', 'Main', 'Dessert'];
    const sums: Record<Course, number> = { Starter: 0, Main: 0, Dessert: 0 };
    const counts: Record<Course, number> = { Starter: 0, Main: 0, Dessert: 0 };
    menuItems.forEach((m) => {
      sums[m.course] += m.price;
      counts[m.course] += 1;
    });
    // round to 2 decimals
    const avg: Record<Course, number> = { Starter: 0, Main: 0, Dessert: 0 };
    (courses as Course[]).forEach((c) => {
      avg[c] = counts[c] ? Math.round((sums[c] / counts[c]) * 100) / 100 : 0;
    });
    return avg;
  }, [menuItems]);

  // call animation on menu change
  React.useEffect(() => {
    if (total > 0) animateFlash();
  }, [total]);

  /** Handlers */
  function addItem() {
    // validation: use if statements
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a dish name.');
      return;
    }
    if (!priceText.trim()) {
      Alert.alert('Validation', 'Please enter a price.');
      return;
    }
    const priceNum = Number(priceText);
    // digit-by-digit check should be done by Number parsing and isNaN
    if (Number.isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Validation', 'Price must be a valid non-negative number.');
      return;
    }

    const newItem: MenuItem = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      course,
      price: Math.round(priceNum * 100) / 100,
    };

    setMenuItems((prev) => [...prev, newItem]);

    // reset form fields
    setName('');
    setDescription('');
    setPriceText('');
    setCourse('Starter');

    // go back to home (still same single file) so chef can see item added
    setScreen('home');
  }

  function removeItem(id: string) {
    Alert.alert('Remove item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setMenuItems((prev) => prev.filter((i) => i.id !== id));
        },
      },
    ]);
  }

  // filtered list for filter screen
  const filteredItems = useMemo(() => {
    if (filter === 'All') return menuItems;
    return menuItems.filter((m) => m.course === filter);
  }, [menuItems, filter]);

  /** UI pieces */
  function HeaderBar({ title }: { title: string }) {
    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>{title}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setScreen('home')}>
            <Text style={styles.headerBtnText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setScreen('add')}>
            <Text style={styles.headerBtnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setScreen('filter')}>
            <Text style={styles.headerBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function HomeView() {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderBar title="Christoffel's Menu" />

        <Animated.View
          style={[
            styles.flash,
            {
              opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.95] }),
              transform: [
                {
                  scale: flash.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.flashText}>Menu updated</Text>
        </Animated.View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>Total items: <Text style={styles.summaryValue}>{total}</Text></Text>
          <Text style={styles.avgTitle}>Average prices</Text>
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
                <Text style={styles.cardPrice}>R {item.price.toFixed(2)}</Text>
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
              <Text style={{ color: '#666' }}>No menu items yet. Go to Add to create some.</Text>
            </View>
          )}
        />

        <View style={styles.bottom}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('add')}>
            <Text style={styles.primaryButtonText}>+ Add Menu Item</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('filter')}>
            <Text style={styles.secondaryButtonText}>Filter Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function AddView() {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderBar title="Add Menu Item" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.label}>Dish Name</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g. Lemon Chicken" />

            <Text style={styles.label}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} placeholder="Short description" multiline />

            <Text style={styles.label}>Course</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={course} onValueChange={(v: Course) => setCourse(v as Course)}>
                <Picker.Item label="Starter" value="Starter" />
                <Picker.Item label="Main" value="Main" />
                <Picker.Item label="Dessert" value="Dessert" />
              </Picker>
            </View>

            <Text style={styles.label}>Price (R)</Text>
            <TextInput
              value={priceText}
              onChangeText={(t) => setPriceText(t)}
              style={styles.input}
              placeholder="e.g. 120.00"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={addItem}>
              <Text style={styles.saveText}>Save Dish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                Alert.alert('Clear form', 'Clear all fields?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', onPress: () => { setName(''); setDescription(''); setPriceText(''); setCourse('Starter'); } },
                ]);
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  function FilterView() {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderBar title="Filter by Course" />

        <View style={{ padding: 12 }}>
          <View style={styles.pickerWrap}>
            <Picker
  selectedValue={filter}
  onValueChange={(value) => setFilter(value)}
  style={{ height: 50, width: 200 }}
>
  <Picker.Item label="Starter" value="Starter" />
  <Picker.Item label="Main" value="Main" />
  <Picker.Item label="Dessert" value="Dessert" />
</Picker>
          </View>
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name} <Text style={styles.cardPriceSmall}>R{item.price.toFixed(2)}</Text></Text>
              <Text style={styles.cardDesc}>{item.description || 'No description'}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardCourse}>{item.course}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={{ color: '#666' }}>No items in this category.</Text>
            </View>
          )}
        />

        <View style={{ padding: 12 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('home')}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /** Render single chosen view */
  return screen === 'home' ? <HomeView /> : screen === 'add' ? <AddView /> : <FilterView />;
}

/** Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF9' },
  header: { padding: 12, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 0.5, borderColor: '#EEE' },
  headerText: { fontSize: 20, fontWeight: '700', color: '#1F3B38' },
  headerButtons: { position: 'absolute', right: 12, top: 12, flexDirection: 'row' },
  headerBtn: { marginLeft: 8, padding: 6, backgroundColor: '#E8F0EF', borderRadius: 6 },
  headerBtnText: { color: '#2E4D46', fontWeight: '700' },

  flash: { position: 'absolute', right: 20, top: 90, backgroundColor: '#7BA6A1', padding: 8, borderRadius: 8, zIndex: 10 },
  flashText: { color: '#fff', fontWeight: '700' },

  summary: { padding: 16, backgroundColor: '#fff', margin: 12, borderRadius: 10, elevation: 2 },
  summaryText: { fontSize: 16, color: '#2E4D46', marginVertical: 2 },
  summaryValue: { fontWeight: '700' },
  avgTitle: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#2E4D46' },

  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F3B38' },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#1F3B38' },
  cardPriceSmall: { fontWeight: '700', color: '#1F3B38' },
  cardDesc: { marginTop: 6, color: '#666' },
  cardFooter: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCourse: { fontWeight: '600', color: '#2E4D46' },

  removeText: { color: '#B00020' },

  bottom: { padding: 12, flexDirection: 'row', justifyContent: 'space-between' },
  primaryButton: { backgroundColor: '#7BA6A1', padding: 14, borderRadius: 10, flex: 1, marginRight: 8, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#E8F0EF', padding: 14, borderRadius: 10, flex: 1, marginLeft: 8, alignItems: 'center' },
  secondaryButtonText: { color: '#2E4D46', fontWeight: '700' },

  label: { color: '#2E4D46', marginBottom: 6, fontWeight: '600', marginTop: 6 },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  pickerWrap: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', marginBottom: 12 },

  saveBtn: { backgroundColor: '#7BA6A1', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '700' },
  clearBtn: { backgroundColor: '#EFEFEF', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  clearText: { color: '#B00020', fontWeight: '700' },

  backBtn: { backgroundColor: '#E8F0EF', padding: 12, borderRadius: 8, alignItems: 'center' },
  backText: { fontWeight: '700', color: '#2E4D46' },
});
