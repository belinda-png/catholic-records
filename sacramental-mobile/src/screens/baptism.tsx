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
import { API_URL } from "../src/api";

export default function BaptismScreen() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [person, setPerson] = useState<any>(null);
  const [parish, setParish] = useState("");
  const [date, setDate] = useState("");
  const [minister, setMinister] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchPerson = async () => {
    if (!search.trim()) {
      Alert.alert("Search", "Enter a name or registration number.");
      return;
    }

    setSearching(true);
    setPerson(null);

    try {
      const response = await fetch(
        `${API_URL}/people/search/?q=${encodeURIComponent(search.trim())}`
      );

      const data = await response.json();
      const people = Array.isArray(data) ? data : data.results || [];

      if (people.length === 0) {
        Alert.alert("Person not found", "You can register this person next.");
      } else {
        setPerson(people[0]);
      }
    } catch {
      Alert.alert("Connection error", "Could not connect to Django.");
    } finally {
      setSearching(false);
    }
  };

  const saveBaptism = async () => {
    if (!person || !parish || !date || !minister.trim()) {
      Alert.alert(
        "Missing details",
        "Select a person and parish, then enter the baptism date and minister."
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

      <View style={styles.row}>
        <Text style={styles.label}>Find person</Text>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Name or registration number"
        />
      </View>

      <Pressable style={styles.button} onPress={searchPerson}>
        <Text style={styles.buttonText}>
          {searching ? "Searching..." : "Search"}
        </Text>
      </Pressable>

      {person && (
        <View style={styles.personBox}>
          <Text style={styles.personName}>
            {person.christian_name} {person.surname}
          </Text>
          <Text>Registration: {person.registration_number}</Text>
          <Text>Date of birth: {person.date_of_birth || "—"}</Text>
        </View>
      )}

      <ParishPicker value={parish} onChange={setParish} />

      <View style={styles.row}>
        <Text style={styles.label}>Baptism date</Text>
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
        style={styles.button}
        onPress={saveBaptism}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#174B35",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  label: {
    width: "35%",
    fontWeight: "600",
    color: "#174B35",
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
  button: {
    backgroundColor: "#174B35",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  personBox: {
    padding: 14,
    backgroundColor: "#E8F0E8",
    borderRadius: 10,
    marginBottom: 16,
  },
  personName: {
    color: "#174B35",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
});