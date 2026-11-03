import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";

const records = [
  { title: "Baptisms", route: "/baptism" },
  { title: "First Holy Communion", route: "/communion" },
  { title: "Confirmations", route: "/confirmation" },
  { title: "Matrimonies", route: "/matrimony" },
];

export default function SacramentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sacramental Records</Text>

      {records.map((record) => (
        <Link key={record.route} href={record.route as any} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardText}>{record.title}</Text>
          </Pressable>
        </Link>
      ))}
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
    color: "#123F33",
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    padding: 18,
    backgroundColor: "#FFFEFA",
    borderWidth: 1,
    borderColor: "#E6E0D3",
    borderRadius: 10,
    marginBottom: 12,
  },
  cardText: {
    color: "#123F33",
    fontWeight: "bold",
  },
});