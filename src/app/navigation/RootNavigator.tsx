import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import type {
  HomeStackParamList,
  MarketplaceStackParamList,
  RootTabParamList,
  SettingsStackParamList,
  WorkspaceStackParamList,
} from './types';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { TaskDetailScreen } from '../screens/Home/TaskDetailScreen';
import { GlobalSearchScreen } from '../screens/Search/GlobalSearchScreen';
import { StorageScreen } from '../screens/Storage/StorageScreen';
import { FilesScreen } from '../screens/Files/FilesScreen';
import { MarketplaceScreen } from '../screens/Marketplace/MarketplaceScreen';
import { ModelDetailScreen } from '../screens/Marketplace/ModelDetailScreen';
import { ModelsScreen } from '../screens/Models/ModelsScreen';
import { DownloadsScreen } from '../screens/Downloads/DownloadsScreen';
import { ChatScreen } from '../screens/Chat/ChatScreen';
import { PlaygroundScreen } from '../screens/Playground/PlaygroundScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { WorkspaceDashboardScreen } from '../../workspace/screens/WorkspaceDashboardScreen';
import { DocumentEditorScreen } from '../../workspace/screens/DocumentEditorScreen';
import { AICreatorScreen } from '../../workspace/screens/AICreatorScreen';
import { TemplatesScreen } from '../../workspace/screens/TemplatesScreen';
import {
  AboutScreen,
  AiDisclaimerScreen,
  ContactSupportScreen,
  CopyrightScreen,
  FaqScreen,
  LicensesScreen,
  ModelLicensesScreen,
  PrivacyPolicyScreen,
  ReportIssueScreen,
  TermsOfServiceScreen,
  ThirdPartyLicensesScreen,
} from '../../legal/screens/LegalScreens';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MarketplaceStack = createNativeStackNavigator<MarketplaceStackParamList>();
const WorkspaceStack = createNativeStackNavigator<WorkspaceStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home', headerTitle: () => null, headerShown: false }}
      />
      <HomeStack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Get started' }}
      />
      <HomeStack.Screen
        name="GlobalSearch"
        component={GlobalSearchScreen}
        options={{ title: 'Search' }}
      />
      <HomeStack.Screen
        name="Storage"
        component={StorageScreen}
        options={{ title: 'Storage' }}
      />
      <HomeStack.Screen
        name="Files"
        component={FilesScreen}
        options={{ title: 'Files' }}
      />
    </HomeStack.Navigator>
  );
}

function MarketplaceStackNavigator() {
  return (
    <MarketplaceStack.Navigator>
      <MarketplaceStack.Screen
        name="MarketplaceHome"
        component={MarketplaceScreen}
        options={{ title: 'Get models', headerShown: false }}
      />
      <MarketplaceStack.Screen
        name="ModelDetail"
        component={ModelDetailScreen}
        options={{ title: 'Model' }}
      />
    </MarketplaceStack.Navigator>
  );
}

function WorkspaceStackNavigator() {
  return (
    <WorkspaceStack.Navigator>
      <WorkspaceStack.Screen
        name="WorkspaceHome"
        component={WorkspaceDashboardScreen}
        options={{ title: 'Workspace' }}
      />
      <WorkspaceStack.Screen
        name="DocumentEditor"
        component={DocumentEditorScreen}
        options={{ title: 'Editor' }}
      />
      <WorkspaceStack.Screen
        name="AICreator"
        component={AICreatorScreen}
        options={{ title: 'AI Create' }}
      />
      <WorkspaceStack.Screen
        name="Templates"
        component={TemplatesScreen}
        options={{ title: 'Templates' }}
      />
    </WorkspaceStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy' }}
      />
      <SettingsStack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: 'Terms of Service' }}
      />
      <SettingsStack.Screen
        name="AiDisclaimer"
        component={AiDisclaimerScreen}
        options={{ title: 'AI Disclaimer' }}
      />
      <SettingsStack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
      <SettingsStack.Screen
        name="Licenses"
        component={LicensesScreen}
        options={{ title: 'Licenses' }}
      />
      <SettingsStack.Screen
        name="ThirdPartyLicenses"
        component={ThirdPartyLicensesScreen}
        options={{ title: 'Third-Party Licenses' }}
      />
      <SettingsStack.Screen
        name="ModelLicenses"
        component={ModelLicensesScreen}
        options={{ title: 'Model Licenses' }}
      />
      <SettingsStack.Screen
        name="ContactSupport"
        component={ContactSupportScreen}
        options={{ title: 'Support' }}
      />
      <SettingsStack.Screen
        name="ReportIssue"
        component={ReportIssueScreen}
        options={{ title: 'Report Issue' }}
      />
      <SettingsStack.Screen name="Faq" component={FaqScreen} options={{ title: 'FAQ' }} />
      <SettingsStack.Screen
        name="Copyright"
        component={CopyrightScreen}
        options={{ title: 'Copyright' }}
      />
    </SettingsStack.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown:
          route.name !== 'MarketplaceTab' &&
          route.name !== 'WorkspaceTab' &&
          route.name !== 'SettingsTab' &&
          route.name !== 'HomeTab' &&
          route.name !== 'ChatTab' &&
          route.name !== 'ModelsTab',
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<
            keyof RootTabParamList,
            { outline: keyof typeof MaterialCommunityIcons.glyphMap; filled: keyof typeof MaterialCommunityIcons.glyphMap }
          > = {
            HomeTab: { outline: 'home-outline', filled: 'home' },
            MarketplaceTab: { outline: 'storefront-outline', filled: 'storefront' },
            WorkspaceTab: { outline: 'briefcase-outline', filled: 'briefcase' },
            ModelsTab: { outline: 'package-variant-closed', filled: 'package-variant' },
            DownloadsTab: { outline: 'download-outline', filled: 'download' },
            ChatTab: { outline: 'chat-processing-outline', filled: 'chat-processing' },
            PlaygroundTab: { outline: 'flask-outline', filled: 'flask' },
            SettingsTab: { outline: 'cog-outline', filled: 'cog' },
          };
          const icons = map[route.name];
          return (
            <MaterialCommunityIcons
              name={focused ? icons.filled : icons.outline}
              color={color}
              size={size}
            />
          );
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant ?? theme.colors.outline,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 8,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home', tabBarAccessibilityLabel: 'Home tab' }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceStackNavigator}
        options={{ title: 'Get', tabBarAccessibilityLabel: 'Download models tab' }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ title: 'Chat', tabBarAccessibilityLabel: 'Chat tab' }}
      />
      <Tab.Screen
        name="ModelsTab"
        component={ModelsScreen}
        options={{ title: 'Mine', tabBarAccessibilityLabel: 'Installed models tab' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: 'Settings', tabBarAccessibilityLabel: 'Settings tab' }}
      />
      {/* Kept for deep links; hidden from tab bar to reduce clutter */}
      <Tab.Screen
        name="WorkspaceTab"
        component={WorkspaceStackNavigator}
        options={{
          title: 'Workspace',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="DownloadsTab"
        component={DownloadsScreen}
        options={{
          title: 'Downloads',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="PlaygroundTab"
        component={PlaygroundScreen}
        options={{
          title: 'Play',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
