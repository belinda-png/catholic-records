import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";

import { useRouter } from "expo-router";
import ParishPicker from "../src/components/ParishPicker";
import PersonSearch, { Person } from "../src/components/PersonSearch";
import { API_URL } from "../src/app";

export default function BaptismScreen() {
  const router = useRouter();

  const [person, setPerson] = useState<Person | null>(null);
  const [parish, setParish] = useState("");
  const [date, setDate] = useState("");
  const [minister, setMinister] = useState("");
  const [saving, setSaving] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const saveBaptism = async () => {
    if (!person) {
      Alert.alert("Person required", "Search for and choose a person first.");
      return;
    }

    if (!parish || !date.trim() || !minister.trim()) {
      Alert.alert(
        "Missing details",
        "Enter the parish, baptism date, and minister."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/baptisms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person: person.id,
          registration_number: person.registration_number,
          parish: Number(parish),
          date_of_baptism: date,
          minister: minister.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Could not save baptism", JSON.stringify(data));
        return;
      }

      Alert.alert("Success", "Baptism record saved.");
      router.back();
    } catch {
      Alert.alert("Connection error", "Could not connect to Django.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Baptism Record</Text>

      <PersonSearch
        onPersonFound={(foundPerson) => {
          setPerson(foundPerson);
          setShowRegister(false);
        }}
        onAddPerson={(searchText) => {
          setShowRegister(true);
          setPerson(null);
        }}
      />

      {person && (
        <View style={styles.personCard}>
          <Text style={styles.personTitle}>Person Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Christian Name</Text>
            <Text style={styles.value}>{person.christian_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Surname</Text>
            <Text style={styles.value}>{person.surname}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Registration No.</Text>
            <Text style={styles.value}>
              {person.registration_number}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Date of Birth</Text>
            <Text style={styles.value}>
              {person.date_of_birth || "Not provided"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>
              {person.phone_number || "Not provided"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Home Parish</Text>
            <Text style={styles.value}>
              {person.home_parish_name || "Not provided"}
            </Text>
          </View>

          <Pressable
            style={styles.changeButton}
            onPress={() => setPerson(null)}
          >
            <Text style={styles.changeButtonText}>Change Person</Text>
          </Pressable>
        </View>
      )}

      {showRegister && (
        <View style={styles.registerNotice}>
          <Text style={styles.registerTitle}>
            This person is not in the system.
          </Text>
          <Text style={styles.registerText}>
            We will add the registration form here next.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Baptism Details</Text>

      <ParishPicker value={parish} onChange={setParish} />

      <View style={styles.row}>
        <Text style={styles.label}>Baptism Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Minister</Text>
        <TextInput
          style={styles.input}
          value={minister}
          onChangeText={setMinister}
          placeholder="Minister's name"
        />
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={saveBaptism}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Baptism"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#FFFDF5",
    flexGrow: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#174B35",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#174B35",
    marginTop: 12,
    marginBottom: 14,
  },
  personCard: {
    backgroundColor: "#E8F0E8",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  personTitle: {
    color: "#174B35",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  label: {
    width: "38%",
    color: "#174B35",
    fontWeight: "600",
  },
  value: {
    flex: 1,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#D5D5C8",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "white",
  },
  changeButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#174B35",
  },
  changeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  registerNotice: {
    padding: 14,
    backgroundColor: "#F7F3E8",
    borderRadius: 8,
    marginBottom: 18,
  },
  registerTitle: {
    fontWeight: "bold",
    color: "#5A4A2A",
  },
  registerText: {
    color: "#5A4A2A",
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: "#174B35",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});