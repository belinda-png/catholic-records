import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { API_URL } from "../api";

export type Field = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "date" | "gender";
  required?: boolean;
};

export type SacramentConfig = {
  name: string;
  subtitle: string;
  endpoint: string; // e.g. "baptisms" -> POST /api/baptisms/
  fields: Field[];
};

type Props = {
  visible: boolean;
  sacrament: SacramentConfig | null;
  onClose: () => void;
};

const formatErrors = (data: any) =>
  Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
    .join("\n");

export default function SacramentFormModal({ visible, sacrament, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // start with a clean form every time a card is opened
  useEffect(() => {
    if (visible) {
      setValues({});
      setError("");
      setSaved(false);
    }
  }, [visible, sacrament?.name]);

  if (!sacrament) return null;

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    const missing = sacrament.fields.filter(
      (f) => f.required && !values[f.key]?.trim()
    );
    if (missing.length) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    // send only the fields that were filled in
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v.trim() !== "")
    );

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/${sacrament.endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data ? formatErrors(data) : "Could not save. Please try again.");
      } else {
        setSaved(true);
        setTimeout(onClose, 900);
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{sacrament.name}</Text>
                <Text style={styles.subtitle}>{sacrament.subtitle}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 460 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {sacrament.fields.map((f) => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.label}>
                    {f.label}
                    {f.required ? <Text style={styles.star}> *</Text> : null}
                  </Text>

                  {f.type === "gender" ? (
                    <View style={styles.pills}>
                      {[
                        { label: "Male", value: "M" },
                        { label: "Female", value: "F" },
                      ].map((o) => {
                        const active = values[f.key] === o.value;
                        return (
                          <Pressable
                            key={o.value}
                            onPress={() => set(f.key, o.value)}
                            style={[styles.pill, active && styles.pillActive]}
                          >
                            <Text style={[styles.pillText, active && styles.pillTextActive]}>
                              {o.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <TextInput
                      style={styles.input}
                      value={values[f.key] ?? ""}
                      onChangeText={(t) => set(f.key, t)}
                      placeholder={
                        f.type === "date" ? "YYYY-MM-DD" : f.placeholder ?? ""
                      }
                      placeholderTextColor="#A9ADA6"
                      keyboardType={f.type === "date" ? "numbers-and-punctuation" : "default"}
                    />
                  )}
                </View>
              ))}
            </ScrollView>

            {!!error && <Text style={styles.error}>{error}</Text>}
            {saved && <Text style={styles.success}>Saved successfully ✓</Text>}

            <Pressable
              style={[styles.saveBtn, (saving || saved) && { opacity: 0.6 }]}
              onPress={submit}
              disabled={saving || saved}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveText}>Save {sacrament.name} Record</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const GREEN = "#174B35";

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFDF5",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D9D5C7",
    marginBottom: 14,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "bold", color: GREEN },
  subtitle: { fontSize: 13, color: "#858A83", marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFEBDD",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 15, color: GREEN, fontWeight: "bold" },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#3B4A42", marginBottom: 6 },
  star: { color: "#B00020" },
  input: {
    borderWidth: 1,
    borderColor: "#DDD8C8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    backgroundColor: "white",
    color: "#1F2A24",
  },
  pills: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD8C8",
    backgroundColor: "white",
    alignItems: "center",
  },
  pillActive: { backgroundColor: GREEN, borderColor: GREEN },
  pillText: { fontSize: 15, color: "#3B4A42", fontWeight: "600" },
  pillTextActive: { color: "white" },
  error: { color: "#B00020", marginTop: 6, marginBottom: 6, fontSize: 13 },
  success: { color: GREEN, fontWeight: "bold", marginTop: 6, marginBottom: 6 },
  saveBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { color: "white", fontSize: 16, fontWeight: "bold" },
});