import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#123F33",
        },
        headerTintColor: "#FFFFFF",
        contentStyle: {
          backgroundColor: "#F8F5ED",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="baptism"
        options={{ title: "Baptism Record" }}
      />

      <Stack.Screen
        name="communion"
        options={{ title: "First Holy Communion" }}
      />

      <Stack.Screen
        name="confirmation"
        options={{ title: "Confirmation Record" }}
      />

      <Stack.Screen
        name="matrimony"
        options={{ title: "Matrimony Record" }}
      />

      <Stack.Screen
        name="people"
        options={{ title: "People Directory" }}
      />

      <Stack.Screen
        name="sacraments"
        options={{ title: "Sacramental Records" }}
      />

      <Stack.Screen
        name="register-person"
        options={{ title: "Register Person" }}
      />

      <Stack.Screen
        name="profile/[id]"
        options={{ title: "Person Profile" }}
      />
    </Stack>
  );
}