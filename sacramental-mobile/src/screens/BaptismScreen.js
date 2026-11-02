import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";

const API = "http://127.0.0.1:8000/api";

export default function BaptismScreen() {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [person, setPerson] = useState(null);
  const [date, setDate] = useState("");
  const [minister, setMinister] = useState("");
  const [parish, setParish] = useState("");

  async function searchPerson(value) {
    setQuery(value);
    setPerson(null);

    if (value.trim().length < 2) {
      setPeople([]);
      return;
    }

    try {
      const response = await fetch(
        `${API}/people/search/?q=${encodeURIComponent(value)}`
      );

      const data = await response.json();
      setPeople(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.log("Person search failed:", error);
    }
  }

  async function saveBaptism() {
    if (!person || !date || !minister || !parish) {
      Alert.alert("Missing details", "Please complete all fields.");
      return;
    }

    try {
      const response = await fetch(`${API}/baptisms/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person: person.id,
          registration_number: person.registration_number,
          date_of_baptism: date,
          minister,
          parish: Number(parish),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(error);
        Alert.alert("Error", "Could not save the baptism record.");
        return;
      }

      Alert.alert("Success", "Baptism record saved.");
      setPerson(null);
      setQuery("");
      setDate("");
      setMinister("");
      setParish("");
    } catch (error) {
      Alert.alert("Connection error", "Could not connect to the server.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Baptism Record</Text>
      <Text style={styles.subtitle}>
        Search for a person using their name or registration number.
      </Text>

      <Text style={styles.label}>Person search</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter name or registration number"
        value={query}
        onChangeText={searchPerson}
      />

      {people.map((item) => (
        <Pressable
          key={item.id}
          style={styles.result}
          onPress={() => {
            setPerson(item);
            setQuery(
              `${item.registration_number} — ${item.christian_name} ${item.surname}`
            );
            setPeople([]);
          }}
        >
          <Text style={styles.resultName}>
            {item.christian_name} {item.surname}
          </Text>
          <Text style={styles.resultNumber}>
            {item.registration_number}
          </Text>
        </Pressable>
      ))}

      {person && (
        <View style={styles.personCard}>
          <Text style={styles.personTitle}>Selected Person</Text>
          <Text>
            Name: {person.christian_name} {person.surname}
          </Text>
          <Text>
            Registration No: {person.registration_number}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Baptism date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

      <Text style={styles.label}>Minister</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter minister's name"
        value={minister}
        onChangeText={setMinister}
      />

      <Text style={styles.label}>Parish ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter parish ID"
        value={parish}
        onChangeText={setParish}
        keyboardType="numeric"
      />

      <Pressable style={styles.button} onPress={saveBaptism}>
        <Text style={styles.buttonText}>Save Baptism Record</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F3E9",
  },
  content: {
    padding: 20,
  },
  title: {
    color: "#123D2A",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6C756E",
    marginBottom: 20,
  },
  label: {
    color: "#123D2A",
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADFD6",
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
  },
  result: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E2D8",
  },
  resultName: {
    color: "#123D2A",
    fontWeight: "bold",
  },
  resultNumber: {
    color: "#747B75",
    marginTop: 3,
  },
  personCard: {
    backgroundColor: "#E9F0E8",
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
  },
  personTitle: {
    color: "#123D2A",
    fontWeight: "bold",
    marginBottom: 7,
  },
  button: {
    backgroundColor: "#123D2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});