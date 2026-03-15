/**
 * MainNavigator.tsx — Navigation par rôle
 *
 * ADMIN   : Admin · Profile · Settings
 * MANAGER : Home · Control · Team · Profile · Settings
 * AGENT   : Home · Control · Profile · Settings
 *
 * The old per-screen Header (logo + search + notifications + profile row)
 * has been REMOVED.  It is replaced by the new shared <AppHeader /> which
 * is injected via withHeader() below.
 */

import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen }      from '../screens/dashboard/DashboardScreen';
import { ControlScreen }        from '../screens/control/ControlScreen';
import { AdminScreen }          from '../screens/admin/AdminScreen';
import { ManagerAgentsScreen }  from '../screens/manager/ManagerAgentsScreen';
import { ProfileScreen }        from '../screens/profile/ProfileScreen';
import { SettingsScreen }       from '../screens/settings/SettingsScreen';

import { AppHeader } from '../components/AppHeader';
import { Colors }    from '../constants/theme';
import { useAuth }   from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();
const WEEG_BLUE = '#1a6fe8';

// ─── Pending alerts hook ───────────────────────────────────────────────────────
// TODO: replace with real fetch when /alerts/pending-count/ endpoint is ready
function usePendingAlerts() {
  const [count] = React.useState(0);
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
};

// ─── withHeader HOC ───────────────────────────────────────────────────────────
// Wraps a screen with the shared AppHeader.
// The page title is derived from the current route name.

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
const SettingsWrapped      = withHeader(SettingsScreen,      'Settings');

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
  headerShown:          false,
  tabBarStyle,
  tabBarActiveTintColor:   WEEG_BLUE,
  tabBarInactiveTintColor: Colors.gray400,
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, marginTop: 2 },
};

// ─── Tab icon/label options ────────────────────────────────────────────────────
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

// ─── Role navigators ───────────────────────────────────────────────────────────

function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={navigatorScreenOptions}>
      <Tab.Screen name="Admin"    component={AdminWrapped}    options={tabOptions.Admin}    />
      <Tab.Screen name="Profile"  component={ProfileWrapped}  options={tabOptions.Profile}  />
      <Tab.Screen name="Settings" component={SettingsWrapped} options={tabOptions.Settings} />
    </Tab.Navigator>
  );
}

function ManagerNavigator() {
  return (
    <Tab.Navigator screenOptions={navigatorScreenOptions}>
      <Tab.Screen name="Home"     component={HomeWrapped}          options={tabOptions.Home}    />
      <Tab.Screen name="Control"  component={ControlWrapped}       options={tabOptions.Control} />
      <Tab.Screen name="Team"     component={ManagerAgentsWrapped} options={tabOptions.Team}    />
      <Tab.Screen name="Profile"  component={ProfileWrapped}       options={tabOptions.Profile} />
      <Tab.Screen name="Settings" component={SettingsWrapped}      options={tabOptions.Settings}/>
    </Tab.Navigator>
  );
}

function AgentNavigator() {
  return (
    <Tab.Navigator screenOptions={navigatorScreenOptions}>
      <Tab.Screen name="Home"     component={HomeWrapped}     options={tabOptions.Home}    />
      <Tab.Screen name="Control"  component={ControlWrapped}  options={tabOptions.Control} />
      <Tab.Screen name="Profile"  component={ProfileWrapped}  options={tabOptions.Profile} />
      <Tab.Screen name="Settings" component={SettingsWrapped} options={tabOptions.Settings}/>
    </Tab.Navigator>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────
export function MainNavigator() {
  const { user } = useAuth();
  if (user?.role === 'admin')   return <AdminNavigator />;
  if (user?.role === 'manager') return <ManagerNavigator />;
  return <AgentNavigator />;
}