import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function PersonProfile() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Person Profile</Text>
      <Text style={styles.text}>Person ID: {id}</Text>
      <Text style={styles.text}>
        We will connect the person's full history here.
      </Text>
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
    marginBottom: 15,
  },
  text: {
    color: "#555",
    marginBottom: 8,
  },
});