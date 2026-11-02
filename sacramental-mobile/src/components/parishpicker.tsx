import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { API_URL } from "../api";

export type Person = {
  id: number;
  registration_number: string;
  christian_name: string;
  surname: string;
  date_of_birth?: string;
  phone_number?: string;
  father_name?: string;
  mother_name?: string;
  home_parish?: number;
  home_parish_name?: string;
};

type Props = {
  onPersonFound: (person: Person) => void;
  onAddPerson: (searchText: string) => void;
};

export default function PersonSearch({
  onPersonFound,
  onAddPerson,
}: Props) {
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = search.trim();

    if (query.length < 2) {
      setPeople([]);
      setSearched(false);
      setError("");
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/people/search/?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error("Search request failed.");
        }

        const data = await response.json();

        const results: Person[] = Array.isArray(data)
          ? data
          : data.results || [];

        setPeople(results);
        setSearched(true);
      } catch {
        setError("Could not connect to the database. Check your server.");
        setPeople([]);
        setSearched(false);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const selectPerson = (person: Person) => {
    setSearch(
      `${person.christian_name} ${person.surname} — ${person.registration_number}`
    );
    setPeople([]);
    setSearched(false);
    onPersonFound(person);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Search by name or registration number</Text>

      <TextInput
        style={styles.input}
        value={search}
        onChangeText={(value) => {
          setSearch(value);
          setSearched(false);
        }}
        placeholder="Enter name or registration number"
        autoCorrect={false}
      />

      {loading && (
        <View style={styles.status}>
          <ActivityIndicator color="#174B35" />
          <Text style={styles.statusText}>Searching people...</Text>
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      {people.length > 0 && (
        <View style={styles.results}>
          {people.map((person) => (
            <Pressable
              key={person.id}
              style={styles.resultItem}
              onPress={() => selectPerson(person)}
            >
              <Text style={styles.personName}>
                {person.christian_name} {person.surname}
              </Text>

              <Text style={styles.registration}>
                Reg. No: {person.registration_number}
              </Text>

              <Text style={styles.tapText}>Tap to use this person</Text>
            </Pressable>
          ))}
        </View>
      )}

      {searched && people.length === 0 && !loading && !error && (
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>
            This person is not in the system.
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={() => onAddPerson(search.trim())}
          >
            <Text style={styles.addButtonText}>+ Add New Person</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    color: "#174B35",
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D5D5C8",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
  },
  statusText: {
    color: "#666",
  },
  results: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D5D5C8",
    borderRadius: 8,
    overflow: "hidden",
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6DD",
    backgroundColor: "#FFFFFF",
  },
  personName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#174B35",
  },
  registration: {
    marginTop: 3,
    color: "#555",
  },
  tapText: {
    marginTop: 4,
    fontSize: 12,
    color: "#888",
  },
  notFound: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#F7F3E8",
    borderRadius: 8,
  },
  notFoundText: {
    color: "#5A4A2A",
    marginBottom: 10,
  },
  addButton: {
    alignSelf: "flex-start",
    backgroundColor: "#174B35",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  error: {
    color: "#B42318",
    marginTop: 8,
  },
});