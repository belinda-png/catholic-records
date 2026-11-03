import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Profile for person {id}</Text>
    </View>
  );
}