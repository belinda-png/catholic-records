import { useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { API_URL } from "../api";

export type Person = {
  id: number;
  christian_name?: string;
  surname?: string;
  registration_number?: string;
};

type Props = {
  onPersonFound: (person: Person) => void;
  onAddPerson: () => void;
};

export default function PersonSearch({ onPersonFound, onAddPerson }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    // wait 400ms after typing stops, so we don't call the API on every key
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_URL}/people/search/?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.results ?? data); // plain list or paginated
      } catch (e) {
        setError("Could not reach the server.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const searched = query.trim().length >= 2 && !loading && !error;

  return (
    <View style={{ marginBottom: 16 }}>
      <TextInput
        style={styles.input}
        placeholder="Name or registration number..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {results.map((item) => (
        <Pressable
          key={item.id}
          style={styles.row}
          onPress={() => onPersonFound(item)}
        >
          <Text style={styles.rowText}>
            {item.christian_name} {item.surname}
          </Text>
          {!!item.registration_number && (
            <Text style={styles.rowSub}>Reg No: {item.registration_number}</Text>
          )}
        </Pressable>
      ))}

      {searched && results.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No person found.</Text>
          <Pressable onPress={onAddPerson}>
            <Text style={styles.addLink}>Register this person</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    fontSize: 16,
  },
  row: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  rowText: { fontSize: 16, color: "#174B35", fontWeight: "600" },
  rowSub: { fontSize: 13, color: "#777", marginTop: 2 },
  emptyBox: { padding: 14, alignItems: "center" },
  empty: { color: "#777" },
  addLink: { color: "#174B35", fontWeight: "bold", marginTop: 6 },
  error: { color: "#B00020", marginTop: 10 },
});