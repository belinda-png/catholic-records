import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";


export default function HomeScreen() {
  const router = useRouter();

  const sacraments = [
    "Baptism",
    "First Communion",
    "Confirmation",
    "Matrimony",
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sacramental Records</Text>
      <Text style={styles.subtitle}>Tororo Archdiocese</Text>

      {sacraments.map((sacrament) => (
        <Pressable
          key={sacrament}
          style={styles.card}
          onPress={() => router.push("/explore")}
        >
          <Text style={styles.cardText}>{sacrament}</Text>
        </Pressable>
      ))}
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#174B35",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    padding: 18,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#174B35",
  },
  cardText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
});