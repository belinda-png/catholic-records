import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Link } from "expo-router";
import { API_URL } from "../src/api";

type Parish = {
  id: number;
  name: string;
};

type Person = {
  id: number;
  registration_number: string;
  christian_name: string;
  surname: string;
  date_of_birth?: string;
  home_parish_name?: string;
};

const COLORS = {
  green: "#123F33",
  greenLight: "#28594A",
  cream: "#F8F5ED",
  white: "#FFFEFA",
  gold: "#C49A35",
  sage: "#E4EEE6",
  text: "#153E34",
  muted: "#8A948C",
  border: "#E6E0D3",
};

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  const [parishes, setParishes] = useState<Parish[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedParish, setSelectedParish] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const query = search.trim();

    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchPeople(query);
      } else {
        loadPeople();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, selectedParish]);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/parishes/`);

      if (!response.ok) {
        throw new Error("Could not load parishes.");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || [];

      setParishes(list);

      if (list.length > 0) {
        setSelectedParish(String(list[0].id));
      }
    } catch {
      setError("Could not connect to Django. Check that your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const loadPeople = async () => {
    try {
      const response = await fetch(`${API_URL}/people/`);

      if (!response.ok) return;

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || [];

      setPeople(list);
    } catch {
      // Keep the dashboard visible if the API is unavailable.
    }
  };

  const searchPeople = async (query: string) => {
    try {
      const response = await fetch(
        `${API_URL}/people/search/?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) return;

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || [];

      setPeople(list);
    } catch {
      // Keep the dashboard visible if the API is unavailable.
    }
  };

  const selectedParishName =
    parishes.find((p) => String(p.id) === selectedParish)?.name || "Select parish";

  const sacramentCards = [
    {
      title: "Baptisms",
      count: "—",
      icon: "♧",
      color: "#F5EBD0",
      iconColor: COLORS.gold,
      route: "/baptism",
    },
    {
      title: "First Holy Communion",
      count: "—",
      icon: "▤",
      color: "#E5EEE5",
      iconColor: "#64876A",
      route: "/communion",
    },
    {
      title: "Confirmations",
      count: "—",
      icon: "✝",
      color: "#E2EEE7",
      iconColor: "#38745D",
      route: "/confirmation",
    },
    {
      title: "Matrimonies",
      count: "—",
      icon: "♡",
      color: "#F5EBD0",
      iconColor: COLORS.gold,
      route: "/matrimony",
    },
  ];

  return (
    <View style={styles.app}>
      {!isMobile && (
        <View style={styles.sidebar}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>♙</Text>
            </View>

            <View>
              <Text style={styles.brandTitle}>Parish Records</Text>
              <Text style={styles.brandSubtitle}>TORORO ARCHDIOCESE</Text>
            </View>
          </View>

          <Text style={styles.menuLabel}>MAIN MENU</Text>

          <View style={styles.activeMenu}>
            <Text style={styles.menuText}>⌂  Dashboard</Text>
          </View>

          <Link href="/people" asChild>
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuText}>♙  People directory</Text>
            </Pressable>
          </Link>

          <Link href="/sacraments" asChild>
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuText}>♧  Sacramental records</Text>
            </Pressable>
          </Link>

          <View style={styles.sidebarFooter}>
            <Text style={styles.footerFaith}>✝</Text>
            <Text style={styles.sidebarFooterText}>
              Faithfully preserving{"\n"}our sacramental history.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.main}>
        <View style={styles.topbar}>
          <Text style={styles.breadcrumb}>Archdiocese　/　Dashboard</Text>
          <Text style={styles.topbarStatus}>● Records Management</Text>
        </View>

        {isMobile && (
          <View style={styles.mobileBrand}>
            <Text style={styles.brandTitle}>Parish Records</Text>
            <Text style={styles.brandSubtitle}>TORORO ARCHDIOCESE</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.contentWidth, isMobile && styles.mobileContent]}>
            <View style={styles.headingRow}>
              <View style={styles.headingIcon}>
                <Text style={styles.headingIconText}>♙</Text>
              </View>

              <View style={styles.headingText}>
                <Text style={styles.eyebrow}>TORORO ARCHDIOCESE</Text>
                <Text style={styles.pageTitle}>Sacramental Records</Text>
                <Text style={styles.pageSubtitle}>
                  A central place to preserve, manage, and find parish records.
                </Text>
              </View>

              <View style={styles.headingActions}>
                <Link href="/people" asChild>
                  <Pressable style={styles.registerButton}>
                    <Text style={styles.registerButtonText}>
                      + Register Person
                    </Text>
                  </Pressable>
                </Link>

                <View style={styles.peopleCircle}>
                  <Text style={styles.circleLabel}>Registered people</Text>
                  <Text style={styles.circleCount}>{people.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.parishBar}>
              <View style={styles.parishIcon}>
                <Text style={styles.parishIconText}>♧</Text>
              </View>

              <View style={styles.parishSelectArea}>
                <Text style={styles.smallLabel}>SELECT PARISH</Text>

                <ScrollView horizontal>
                  <View style={styles.parishOptions}>
                    {parishes.map((parish) => (
                      <Pressable
                        key={parish.id}
                        onPress={() => setSelectedParish(String(parish.id))}
                        style={[
                          styles.parishOption,
                          selectedParish === String(parish.id) &&
                            styles.parishOptionSelected,
                        ]}
                      >
                        <Text style={styles.parishName}>{parish.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.archdioceseArea}>
                <Text style={styles.smallLabel}>ARCHDIOCESE</Text>
                <Text style={styles.archdioceseName}>
                  Tororo Archdiocese
                </Text>
              </View>

              <Pressable style={styles.refreshButton} onPress={loadDashboard}>
                <Text style={styles.refreshText}>⟳ Refresh</Text>
              </Pressable>
            </View>

            {loading && (
              <ActivityIndicator
                color={COLORS.green}
                style={{ marginVertical: 20 }}
              />
            )}

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Parish overview</Text>
              <Text style={styles.sectionSubtitle}>
                Current sacramental records and registered members
              </Text>
            </View>

            <View style={[styles.sacramentGrid, isMobile && styles.mobileGrid]}>
              {sacramentCards.map((card) => (
                <Link key={card.title} href={card.route as any} asChild>
                  <Pressable style={styles.sacramentCard}>
                    <View
                      style={[
                        styles.sacramentIcon,
                        { backgroundColor: card.color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sacramentIconText,
                          { color: card.iconColor },
                        ]}
                      >
                        {card.icon}
                      </Text>
                    </View>

                    <Text style={styles.sacramentTitle}>{card.title}</Text>
                    <Text style={styles.sacramentCount}>{card.count}</Text>
                    <Text style={styles.totalRecords}>Total records</Text>
                  </Pressable>
                </Link>
              ))}
            </View>

            <View style={styles.directoryCard}>
              <View style={styles.directoryHeading}>
                <View>
                  <Text style={styles.sectionTitle}>People directory</Text>
                  <Text style={styles.sectionSubtitle}>
                    Search by name or registration number
                  </Text>
                </View>

                <View style={styles.peopleBadge}>
                  <Text style={styles.peopleBadgeText}>
                    {people.length} people
                  </Text>
                </View>
              </View>

              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>⌕</Text>

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Enter a name or registration number..."
                  placeholderTextColor="#9A9A91"
                  style={styles.searchInput}
                />
              </View>

              <ScrollView horizontal>
                <View style={styles.peopleTable}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeading, styles.personColumn]}>
                      PERSON
                    </Text>
                    <Text style={[styles.tableHeading, styles.regColumn]}>
                      REGISTRATION NO.
                    </Text>
                    <Text style={[styles.tableHeading, styles.parishColumn]}>
                      HOME PARISH
                    </Text>
                    <Text style={[styles.tableHeading, styles.dobColumn]}>
                      DATE OF BIRTH
                    </Text>
                    <Text style={[styles.tableHeading, styles.profileColumn]}>
                      PROFILE
                    </Text>
                  </View>

                  {people.map((person) => (
                    <View key={person.id} style={styles.tableRow}>
                      <Text style={[styles.personCell, styles.personColumn]}>
                        ◉　{person.christian_name} {person.surname}
                      </Text>

                      <Text style={[styles.regCell, styles.regColumn]}>
                        {person.registration_number}
                      </Text>

                      <Text style={[styles.tableCell, styles.parishColumn]}>
                        {person.home_parish_name || selectedParishName}
                      </Text>

                      <Text style={[styles.tableCell, styles.dobColumn]}>
                        {person.date_of_birth || "—"}
                      </Text>

                      <Link
                        href={`/profile/${person.id}` as any}
                        asChild
                      >
                        <Pressable
                          style={[
                            styles.profileButton,
                            styles.profileColumn,
                          ]}
                        >
                          <Text style={styles.profileButtonText}>
                            View history
                          </Text>
                        </Pressable>
                      </Link>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.tableFooter}>
                <Text style={styles.tableFooterText}>
                  Records are loaded from the database.
                </Text>
                <Text style={styles.tableFooterText}>
                  {people.length} results
                </Text>
              </View>
            </View>

            <View style={styles.pageFooter}>
              <Text style={styles.pageFooterText}>
                Tororo Archdiocese • Sacramental Records Management
              </Text>
              <Text style={styles.pageFooterText}>
                Faith • Community • Record
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.cream,
    minHeight: "100%",
  },
  sidebar: {
    width: 174,
    backgroundColor: COLORS.green,
    padding: 14,
    minHeight: "100%",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#386255",
    marginBottom: 24,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: {
    color: COLORS.gold,
    fontSize: 20,
  },
  brandTitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
  brandSubtitle: {
    color: "#C8D8CE",
    fontSize: 8,
    marginTop: 3,
    letterSpacing: 1,
  },
  menuLabel: {
    color: "#A8C2B4",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 12,
    marginLeft: 6,
  },
  activeMenu: {
    backgroundColor: "#28594A",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  menuItem: {
    padding: 12,
    marginBottom: 6,
  },
  menuText: {
    color: "#F1F5F0",
    fontSize: 11,
  },
  sidebarFooter: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#386255",
    paddingTop: 16,
    flexDirection: "row",
    gap: 8,
  },
  footerFaith: {
    color: COLORS.gold,
  },
  sidebarFooterText: {
    color: "#D5E2D9",
    fontSize: 9,
    lineHeight: 15,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  topbar: {
    height: 46,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breadcrumb: {
    color: "#7B817B",
    fontSize: 10,
  },
  topbarStatus: {
    color: "#7B817B",
    fontSize: 9,
  },
  mobileBrand: {
    backgroundColor: COLORS.green,
    padding: 16,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  contentWidth: {
    width: "100%",
    maxWidth: 980,
  },
  mobileContent: {
    paddingBottom: 30,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
    flexWrap: "wrap",
  },
  headingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1EAD5",
    alignItems: "center",
    justifyContent: "center",
  },
  headingIconText: {
    color: COLORS.gold,
    fontSize: 25,
  },
  headingText: {
    flex: 1,
    minWidth: 190,
  },
  eyebrow: {
    color: "#A77D23",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold",
  },
  pageSubtitle: {
    color: "#858A83",
    fontSize: 10,
    marginTop: 7,
  },
  headingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  registerButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 7,
  },
  registerButtonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  peopleCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: "#E5EEE6",
    alignItems: "center",
    justifyContent: "center",
  },
  circleLabel: {
    color: "#7A887E",
    fontSize: 7,
  },
  circleCount: {
    color: COLORS.green,
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 2,
  },
  parishBar: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  parishIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: COLORS.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  parishIconText: {
    color: COLORS.green,
    fontSize: 18,
  },
  parishSelectArea: {
    flex: 1,
    minWidth: 160,
  },
  smallLabel: {
    color: "#88928A",
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "bold",
    marginBottom: 5,
  },
  parishOptions: {
    flexDirection: "row",
    gap: 8,
  },
  parishOption: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  parishOptionSelected: {
    backgroundColor: "#E5EEE6",
  },
  parishName: {
    color: COLORS.green,
    fontWeight: "600",
    fontSize: 11,
  },
  archdioceseArea: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingLeft: 16,
    minWidth: 100,
  },
  archdioceseName: {
    color: COLORS.green,
    fontSize: 10,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 9,
  },
  refreshText: {
    color: COLORS.green,
    fontSize: 9,
  },
  sectionHeading: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  sectionSubtitle: {
    color: "#899087",
    fontSize: 9,
    marginTop: 5,
  },
  sacramentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  mobileGrid: {
    flexDirection: "column",
  },
  sacramentCard: {
    flex: 1,
    minWidth: 145,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 14,
    minHeight: 130,
  },
  sacramentIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  sacramentIconText: {
    fontSize: 18,
  },
  sacramentTitle: {
    color: "#77847A",
    fontSize: 10,
    marginBottom: 15,
  },
  sacramentCount: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: "bold",
  },
  totalRecords: {
    color: "#9A9D95",
    fontSize: 8,
    marginTop: 3,
  },
  directoryCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 16,
  },
  directoryHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  peopleBadge: {
    backgroundColor: "#E5EEE6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  peopleBadgeText: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "bold",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 7,
    paddingHorizontal: 10,
    marginBottom: 14,
    backgroundColor: "white",
  },
  searchIcon: {
    color: "#829087",
    fontSize: 23,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    fontSize: 10,
    color: COLORS.text,
  },
  peopleTable: {
    minWidth: 700,
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F3EC",
    padding: 10,
  },
  tableHeading: {
    color: "#89938A",
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 43,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 8,
  },
  personColumn: {
    width: 230,
  },
  regColumn: {
    width: 150,
  },
  parishColumn: {
    width: 150,
  },
  dobColumn: {
    width: 140,
  },
  profileColumn: {
    width: 110,
  },
  personCell: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "600",
  },
  regCell: {
    color: "#9C741F",
    fontSize: 10,
    fontWeight: "bold",
  },
  tableCell: {
    color: "#78857A",
    fontSize: 10,
  },
  profileButton: {
    borderWidth: 1,
    borderColor: "#CBDACD",
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  profileButtonText: {
    color: COLORS.green,
    fontSize: 9,
  },
  tableFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  tableFooterText: {
    color: "#969B91",
    fontSize: 8,
  },
  pageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  pageFooterText: {
    color: "#9A9C92",
    fontSize: 8,
  },
  errorText: {
    color: "#B42318",
    marginBottom: 12,
  },
});