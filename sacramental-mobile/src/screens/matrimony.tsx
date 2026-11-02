import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MatrimonyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Matrimony</Text>
      <Text style={styles.message}>
        We will add the Matrimony record form here next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#FFFDF5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#174B35",
    textAlign: "center",
  },
  message: {
    marginTop: 12,
    textAlign: "center",
    color: "#777",
  },
});