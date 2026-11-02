import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";

const API = "http://127.0.0.1:8000/api";

export default function RegisterPersonForm({
  homeParish,
  onPersonCreated,
  onCancel,
}) {
  const [form, setForm] = useState({
    registration_number: "",
    christian_name: "",
    surname: "",
    date_of_birth: "",
    phone_number: "",
    father_name: "",
    mother_name: "",
    godparent_name: "",
    residence: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const registerPerson = async () => {
    if (
      !form.registration_number.trim() ||
      !form.christian_name.trim() ||
      !form.surname.trim()
    ) {
      Alert.alert(
        "Required fields",
        "Enter the registration number, Christian name, and surname."
      );
      return;
    }

    if (!homeParish) {
      Alert.alert("Home parish required", "Select the person's home parish.");
      return;
    }

    const payload = {
      ...form,
      home_parish: Number(homeParish),
    };

    setSaving(true);

    try {
      const response = await fetch(`${API}/people/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Registration failed",
          JSON.stringify(data)
        );
        return;
      }

      onPersonCreated(data);
    } catch (error) {
      Alert.alert(
        "Connection error",
        "Could not connect to the Django server."
      );
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    ["registration_number", "Registration number"],
    ["christian_name", "Christian name"],
    ["surname", "Surname"],
    ["date_of_birth", "Date of birth (YYYY-MM-DD)"],
    ["phone_number", "Phone number"],
    ["father_name", "Father's name"],
    ["mother_name", "Mother's name"],
    ["godparent_name", "Godparent's name"],
    ["residence", "Residence"],
    ["notes", "Notes"],
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Register New Person</Text>

      {fields.map(([field, label]) => (
        <View key={field} style={styles.row}>
          <Text style={styles.label}>{label}</Text>

          <TextInput
            style={styles.input}
            value={form[field]}
            onChangeText={(value) => updateField(field, value)}
            placeholder={label}
          />
        </View>
      ))}

      <View style={styles.buttons}>
        <Pressable
          style={styles.saveButton}
          onPress={registerPerson}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Register Person"}
          </Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FFFDF5",
    borderRadius: 12,
    marginTop: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#174B35",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  label: {
    width: "35%",
    color: "#333",
    fontWeight: "500",
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
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: "#174B35",
    padding: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#777",
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});