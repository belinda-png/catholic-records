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
  useWindowDimensions,
} from "react-native";
import { API_URL } from "../api";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "date" | "regno";
  required?: boolean;
  top?: boolean; // shown above the title, like "Phone" on the paper card
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

// Change these to match the parish printed on your cards
const PARISH = {
  name: "HOLY FAMILY PARISH- BUTIRU",
  box: "P.O.Box 234 Tororo, Uganda",
  web: "www.aotug.org | www.tororoarchdiocese.org",
};

const formatErrors = (data: any) =>
  Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
    .join("\n");

const cleanLabel = (label: string) => label.replace(":", "").trim();

export default function SacramentFormModal({ visible, sacrament, onClose }: Props) {
  const { height } = useWindowDimensions();
  const [values, setValues] = useState<Record<string, string>>({});
  const [regPrefix, setRegPrefix] = useState<"INF" | "AD">("INF");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // start with a clean card every time one is opened
  useEffect(() => {
    if (visible) {
      setValues({});
      setRegPrefix("INF");
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
      setError(`Please fill in: ${missing.map((f) => cleanLabel(f.label)).join(", ")}`);
      return;
    }

    // send only the fields that were filled in
    const payload: Record<string, string> = {};
    for (const f of sacrament.fields) {
      const v = values[f.key]?.trim();
      if (!v) continue;
      payload[f.key] = f.type === "regno" ? `${regPrefix}/${v}` : v;
    }

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

  const renderField = (f: Field) => (
    <View key={f.key} style={styles.row}>
      <Text style={styles.label}>
        {f.label}
        {f.required ? <Text style={styles.star}>*</Text> : null}
      </Text>

      {f.type === "regno" && (
        <View style={styles.prefixes}>
          {(["INF", "AD"] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setRegPrefix(p)}
              style={[styles.prefix, regPrefix === p && styles.prefixActive]}
            >
              <Text
                style={[styles.prefixText, regPrefix === p && styles.prefixTextActive]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
          <Text style={styles.slash}>/</Text>
        </View>
      )}

      <TextInput
        style={[styles.input, noOutline]}
        value={values[f.key] ?? ""}
        onChangeText={(t) => set(f.key, t)}
        placeholder={f.type === "date" ? "YYYY-MM-DD" : ""}
        placeholderTextColor="rgba(42,27,77,0.35)"
        keyboardType={f.type === "date" ? "numbers-and-punctuation" : "default"}
      />
    </View>
  );

  const topFields = sacrament.fields.filter((f) => f.top);
  const bodyFields = sacrament.fields.filter((f) => !f.top);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <ScrollView
            style={{ maxHeight: height * 0.94 }}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* The pink paper card */}
            <View style={styles.paper}>
              <View style={styles.frame}>
                {/* Parish header */}
                <View style={styles.header}>
                  <View style={styles.emblem}>
                    <Text style={styles.emblemText}>✝</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.parishName}>{PARISH.name}</Text>
                    <Text style={styles.parishLine}>{PARISH.box}</Text>
                    <Text style={styles.parishWeb}>{PARISH.web}</Text>
                  </View>
                </View>

                {topFields.map(renderField)}

                <Text style={styles.title}>{sacrament.name.toUpperCase()}</Text>

                {bodyFields.map(renderField)}

                <Text style={styles.signature}>Signature and Parish Stamp</Text>
              </View>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}
            {saved && <Text style={styles.success}>Saved successfully ✓</Text>}

            <View style={styles.buttons}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, (saving || saved) && { opacity: 0.6 }]}
                onPress={submit}
                disabled={saving || saved}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveText}>Save Record</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const INK = "#2A1B4D";
const PINK = "#F5AFCB";
const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, serif",
});

// removes the blue focus box on web so the underline stays clean
const noOutline: any = Platform.OS === "web" ? { outlineStyle: "none" } : {};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  scroll: { padding: 16 },

  paper: {
    backgroundColor: PINK,
    borderRadius: 6,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  frame: {
    borderWidth: 1.5,
    borderColor: INK,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  emblem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: INK,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  emblemText: { fontSize: 22, color: INK },
  parishName: {
    fontFamily: SERIF,
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: INK,
  },
  parishLine: { fontSize: 12, color: INK, marginTop: 2 },
  parishWeb: { fontSize: 10.5, color: INK, marginTop: 1 },

  title: {
    fontFamily: SERIF,
    fontSize: 20,
    fontWeight: "bold",
    color: INK,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 10,
  },

  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  label: { fontFamily: SERIF, fontSize: 15, color: INK },
  star: { color: "#B00020", fontWeight: "bold" },
  input: {
    flex: 1,
    minWidth: 60,
    borderBottomWidth: 1,
    borderBottomColor: INK,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 16,
    color: INK,
  },

  prefixes: { flexDirection: "row", alignItems: "center", marginLeft: 6 },
  prefix: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: INK,
    marginRight: 4,
  },
  prefixActive: { backgroundColor: INK },
  prefixText: { fontSize: 12, fontWeight: "bold", color: INK },
  prefixTextActive: { color: PINK },
  slash: { fontSize: 18, color: INK, marginLeft: 2 },

  signature: {
    fontFamily: SERIF,
    fontSize: 15,
    fontWeight: "bold",
    color: INK,
    textAlign: "center",
    marginTop: 30,
  },

  error: { color: "#FFD7DC", marginTop: 12, fontSize: 13, textAlign: "center" },
  success: {
    color: "#C8F5D8",
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
  },

  buttons: { flexDirection: "row", gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "white",
    alignItems: "center",
  },
  cancelText: { color: "white", fontSize: 16, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#174B35",
    alignItems: "center",
  },
  saveText: { color: "white", fontSize: 16, fontWeight: "bold" },
});