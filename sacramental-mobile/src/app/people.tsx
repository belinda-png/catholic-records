import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import PersonSearch, { Person } from "../src/components/PersonSearch";

export default function PeopleScreen() {
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>People Directory</Text>
      <Text style={styles.subtitle}>
        Search by name or registration number.
      </Text>

      <PersonSearch
        onPersonFound={(foundPerson) => {
          setPerson(foundPerson);
          router.push(`/profile/${foundPerson.id}` as any);
        }}
        onAddPerson={() => {
          router.push("/register-person" as any);
        }}
      />

      {person && (
        <Text style={styles.found}>
          Selected: {person.christian_name} {person.surname}
        </Text>
      )}

      <Pressable
        style={styles.button}
        onPress={() => router.push("/register-person" as any)}
      >
        <Text style={styles.buttonText}>+ Register New Person</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8F5ED",
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#123F33",
    marginBottom: 8,
  },
  subtitle: {
    color: "#858A83",
    marginBottom: 20,
  },
  found: {
    color: "#123F33",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#123F33",
    padding: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});