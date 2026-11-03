import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import SacramentFormModal, {
  SacramentConfig,
} from "../components/SacramentFormModal";

const SACRAMENTS: SacramentConfig[] = [
  {
    name: "Baptism",
    subtitle: "Record a new baptism",
    endpoint: "baptisms",
    fields: [
      { key: "registration_number", label: "Registration No.", required: true },
      { key: "christian_name", label: "Christian Name", required: true },
      { key: "surname", label: "Surname", required: true },
      { key: "gender", label: "Gender", type: "gender" },
      { key: "date_of_birth", label: "Date of Birth", type: "date" },
      { key: "date_of_baptism", label: "Date of Baptism", type: "date", required: true },
      { key: "father", label: "Father's Name" },
      { key: "mother", label: "Mother's Name" },
      { key: "godparent", label: "Godparent" },
      { key: "minister", label: "Minister" },
      { key: "residence", label: "Residence" },
    ],
  },
  {
    name: "First Communion",
    subtitle: "Record a first communion",
    endpoint: "communions",
    fields: [
      { key: "registration_number", label: "Registration No.", required: true },
      { key: "christian_name", label: "Christian Name", required: true },
      { key: "surname", label: "Surname", required: true },
      { key: "date_of_communion", label: "Date of Communion", type: "date", required: true },
      { key: "minister", label: "Minister" },
    ],
  },
  {
    name: "Confirmation",
    subtitle: "Record a confirmation",
    endpoint: "confirmations",
    fields: [
      { key: "registration_number", label: "Registration No.", required: true },
      { key: "christian_name", label: "Christian Name", required: true },
      { key: "surname", label: "Surname", required: true },
      { key: "date_of_confirmation", label: "Date of Confirmation", type: "date", required: true },
      { key: "sponsor", label: "Sponsor" },
      { key: "minister", label: "Minister" },
    ],
  },
  {
    name: "Matrimony",
    subtitle: "Record a marriage",
    endpoint: "matrimonies",
    fields: [
      { key: "registration_number", label: "Registration No.", required: true },
      { key: "spouse_name", label: "Spouse's Name", required: true },
      { key: "date_of_marriage", label: "Date of Marriage", type: "date", required: true },
      { key: "spouse_baptism_registration_number", label: "Spouse Baptism Reg. No." },
      { key: "notes", label: "Notes" },
    ],
  },
];

export default function HomeScreen() {
  const [selected, setSelected] = useState<SacramentConfig | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Sacramental Records</Text>
        <Text style={styles.subtitle}>Tororo Archdiocese</Text>

        {SACRAMENTS.map((s) => (
          <Pressable
            key={s.name}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => setSelected(s)}
          >
            <View style={styles.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardText}>{s.name}</Text>
              <Text style={styles.cardSub}>{s.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>

      <SacramentFormModal
        visible={selected !== null}
        sacrament={selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF5" },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#174B35", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#777", textAlign: "center", marginBottom: 28 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: "#174B35",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  accent: { width: 4, height: 38, borderRadius: 2, backgroundColor: "#C9972F", marginRight: 14 },
  cardText: { color: "white", fontSize: 18, fontWeight: "700" },
  cardSub: { color: "#B9CFC4", fontSize: 13, marginTop: 2 },
  chevron: { color: "#C9972F", fontSize: 30, marginLeft: 8 },
});