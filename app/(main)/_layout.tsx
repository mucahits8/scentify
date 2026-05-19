import { Tabs } from "expo-router";
import { Redirect } from "expo-router";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { TabBarIcon } from "@/components/ui/TabBarIcon";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { FONTS } from "@/utils/constants";
import { useI18n } from "@/utils/i18n";

export default function MainTabsLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const profile = useUserStore((state) => state.profile);
  const userHydrated = useUserStore((state) => state.isHydrated);

  if (!authHydrated || !userHydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!profile?.onboardingCompleted) {
    return <Redirect href="/(onboarding)/gender" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 74,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.sansMedium,
          fontSize: 10,
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.forYou"),
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t("tabs.discover"),
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="discover" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push("/create-sheet" as never);
          },
        }}
        options={{
          title: t("tabs.create"),
          tabBarIcon: ({ focused }) => (
            <View style={[styles.createIconWrap, focused && styles.createIconWrapFocused]}>
              <TabBarIcon name="sparkle" color={focused ? colors.tabBar : "#FFFFFF"} focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: t("tabs.collection"),
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="collection" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="profile" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    createIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      marginTop: -2,
    },
    createIconWrapFocused: {
      transform: [{ scale: 1.04 }],
    },
  });
