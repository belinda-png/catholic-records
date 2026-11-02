import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { API_URL } from "../api";

type Parish = {
  id: number;
  name: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function ParishPicker({ value, onChange }: Props) {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadParishes = async () => {
      try {
        const response = await fetch(`${API_URL}/parishes/`);

        if (!response.ok) {
          throw new Error("Could not load parishes.");
        }

        const data = await response.json();

        setParishes(Array.isArray(data) ? data : data.results || []);
      } catch {
        setError("Could not connect to the parish list.");
      } finally {
        setLoading(false);
      }
    };

    loadParishes();
  }, []);

  if (loading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Parish</Text>

      <Picker
        selectedValue={value}
        onValueChange={(itemValue) => onChange(String(itemValue))}
        style={styles.picker}
      >
        <Picker.Item label="Select a parish" value="" />

        {parishes.map((parish) => (
          <Picker.Item
            key={parish.id}
            label={parish.name}
            value={String(parish.id)}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    color: "#174B35",
    marginBottom: 4,
  },
  picker: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D5D5C8",
  },
  error: {
    color: "red",
    marginVertical: 8,
  },
});