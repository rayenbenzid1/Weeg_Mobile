/**
 * src/core/navigation/MainNavigator.tsx — updated
 * ─────────────────────────────────────────────────────────────────────────────
 * Role-based navigation:
 *   ADMIN   : Admin · Profile · Settings
 *   MANAGER : Home · Control · AI · Team · Profile  (AI tab is manager-only)
 *   AGENT   : Home · Control · Profile
 *
 * AI Chat is a stack screen inside ManagerNavigator, not a bottom tab —
 * it slides in from the AI Insights screen via navigation.navigate('AIChat').
 */

import React from 'react';
import { AppState, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ControlScreen } from '../screens/control/ControlScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { ManagerAgentsScreen } from '../screens/manager/ManagerAgentsScreen';
import { AlertsScreen } from '../screens/alerts/AlertsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

// AI Insights screens — manager only
import { AIInsightsScreen } from '../screens/ai-insights/AIInsightsScreen';
import { AIChatScreen } from '../screens/ai-insights/AIChatScreen';

import { AppHeader } from '../components/AppHeader';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { NotificationsService } from '../lib/api';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const WEEG_BLUE = '#1a6fe8';

// ─── Pending alerts ───────────────────────────────────────────────────────────

function usePendingAlerts() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      await NotificationsService.detectNotifications();
      const res = await NotificationsService.getUnreadCount();
      if (active && res.ok && res.data) {
        setCount(res.data.count);
      }
    };

    load();
    const timer = setInterval(load, 15_000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        load();
      }
    });

    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return { pendingAlertsCount: count };
}

// ─── Page title map ────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  Home:     'Dashboard',
  Control:  'Control Panel',
  Admin:    'User Management',
  Team:     'My Team',
  Profile:  'Profile',
  Settings: 'Settings',
  AI:       'AI Insights',
  Alerts:   'Notifications',
};

// ─── withHeader HOC ───────────────────────────────────────────────────────────

function withHeader(Screen: React.ComponentType<any>, routeName: string) {
  return function WrappedScreen(props: any) {
    const { pendingAlertsCount } = usePendingAlerts();
    const title = PAGE_TITLES[routeName] ?? routeName;
    return (
      <View style={{ flex: 1 }}>
        <AppHeader
          title={title}
          pendingAlertsCount={pendingAlertsCount}
          onNotificationPress={() => props.navigation?.navigate?.('Alerts')}
          onProfilePress={() => props.navigation?.navigate?.('Profile')}
        />
        <Screen {...props} />
      </View>
    );
  };
}

// ─── Wrapped screens ───────────────────────────────────────────────────────────

const HomeWrapped          = withHeader(DashboardScreen,     'Home');
const ControlWrapped       = withHeader(ControlScreen,       'Control');
const AdminWrapped         = withHeader(AdminScreen,         'Admin');
const ManagerAgentsWrapped = withHeader(ManagerAgentsScreen, 'Team');
const ProfileWrapped       = withHeader(ProfileScreen,       'Profile');
const AlertsWrapped        = withHeader(AlertsScreen,        'Alerts');
// AI Insights gets the AppHeader via withHeader; Chat is a full-screen stack
const AIInsightsWrapped    = withHeader(AIInsightsScreen,    'AI');

// ─── Shared tab bar style ──────────────────────────────────────────────────────

const tabBarStyle = {
  backgroundColor: Colors.white,
  borderTopColor:  Colors.gray100,
  borderTopWidth:  1,
  paddingTop:      6,
  paddingBottom:   8,
  height:          65,
  elevation:       8,
  shadowColor:     '#000',
  shadowOffset:    { width: 0, height: -2 },
  shadowOpacity:   0.06,
  shadowRadius:    8,
};

const navigatorScreenOptions = {
  headerShown:             false,
  tabBarStyle,
  tabBarActiveTintColor:   WEEG_BLUE,
  tabBarInactiveTintColor: Colors.gray400,
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, marginTop: 2 },
};

// ─── Tab icon options ──────────────────────────────────────────────────────────

const tabOptions = {
  Home: {
    tabBarLabel: 'Home',
    tabBarIcon: ({ focused, color }: any) => (
      <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
    ),
  },
  Control: {
    tabBarLabel: 'Control',
    tabBarIcon: ({ focused, color }: any) => (
      <Ionicons name={focused ? 'pulse' : 'pulse-outline'} size={22} color={color} />
    ),
  },
  AI: {
    tabBarLabel: 'AI',
    tabBarIcon: ({ focused, color }: any) => (
      <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={color} />
    ),
    // Highlight the AI tab with a subtle indicator
    tabBarBadgeStyle: { display: 'none' as any },
  },
  Admin: {
    tabBarLabel: 'Admin',
    tabBarIcon: ({ focused, color }: any) => (
      <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={22} color={color} />
    ),
  },
  Team: {
    tabBarLabel: 'Team',
    tabBarIcon: ({ focused, color }: any) => (
      <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
    ),
  },
  Profile: {
    tabBarLabel: 'Profile',
    tabBarIcon: ({ focused, color }: any) => (
      <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
    ),
  },
  Settings: {
    tabBarLabel: 'Settings',
    tabBarIcon: ({ focused, color }: any) => (
      <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
    ),
  },
};

// ─── Tab navigators ───────────────────────────────────────────────────────────

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={navigatorScreenOptions}>
      <Tab.Screen name="Admin"    component={AdminWrapped}    options={tabOptions.Admin}    />
      <Tab.Screen name="Profile"  component={ProfileWrapped}  options={tabOptions.Profile}  />
      <Tab.Screen
        name="Alerts"
        component={AlertsWrapped}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * ManagerTabs — 5 tabs: Home · Control · AI · Team · Profile
 * No Settings tab in the bottom bar (accessible via Profile screen or drawer).
 * AI tab sits between Control and Team for a natural workflow flow:
 *   Operate → Analyse → Team → People
 */
function ManagerTabs() {
  return (
    <Tab.Navigator screenOptions={navigatorScreenOptions}>
      <Tab.Screen name="Home"    component={HomeWrapped}          options={tabOptions.Home}    />
      <Tab.Screen name="Control" component={ControlWrapped}       options={tabOptions.Control} />
      <Tab.Screen
        name="AI"
        component={AIInsightsWrapped}
        options={{
          ...tabOptions.AI,
          // Subtle glow on the AI tab icon when inactive
          tabBarIcon: ({ focused, color }: any) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={22}
              color={focused ? color : '#8b5cf6'}  // always purple-tinted
            />
          ),
          tabBarActiveTintColor:   '#6366f1',
          tabBarInactiveTintColor: '#8b5cf6',
        }}
      />
      <Tab.Screen name="Team"    component={ManagerAgentsWrapped} options={tabOptions.Team}    />
      <Tab.Screen name="Profile" component={ProfileWrapped}       options={tabOptions.Profile} />
      <Tab.Screen
        name="Alerts"
        component={AlertsWrapped}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

function AgentTabs() {
  return (
    <Tab.Navigator screenOptions={navigatorScreenOptions}>
      <Tab.Screen name="Home"     component={HomeWrapped}     options={tabOptions.Home}    />
      <Tab.Screen name="Control"  component={ControlWrapped}  options={tabOptions.Control} />
      <Tab.Screen name="Profile"  component={ProfileWrapped}  options={tabOptions.Profile} />
      <Tab.Screen
        name="Alerts"
        component={AlertsWrapped}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Stack navigators ─────────────────────────────────────────────────────────
// The AI Chat screen slides over the tab navigator for managers.
// This keeps the tab bar hidden when in chat (full-screen experience).

function ManagerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerTabs" component={ManagerTabs} />
      <Stack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
    </Stack.Navigator>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

export function MainNavigator() {
  const { user } = useAuth();

  if (user?.role === 'admin')   return <AdminTabs />;
  if (user?.role === 'manager') return <ManagerStack />;
  return <AgentTabs />;
}