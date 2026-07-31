import type { NavigatorScreenParams } from '@react-navigation/native';
import type { TaskId } from '../../discover/tasks';

export type HomeStackParamList = {
  Home: undefined;
  TaskDetail: { taskId: TaskId | string };
  GlobalSearch: undefined;
  Storage: undefined;
  Files: undefined;
};

export type MarketplaceStackParamList = {
  MarketplaceHome: undefined;
  ModelDetail: { modelId: string };
};

export type WorkspaceStackParamList = {
  WorkspaceHome: undefined;
  DocumentEditor: { documentId: string };
  AICreator: { initialPrompt?: string; type?: string; templateId?: string } | undefined;
  Templates: undefined;
};

export type LegalStackParamList = {
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  About: undefined;
  Licenses: undefined;
  ThirdPartyLicenses: undefined;
  ModelLicenses: undefined;
  AiDisclaimer: undefined;
  ContactSupport: undefined;
  ReportIssue: undefined;
  Faq: undefined;
  Copyright: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
} & LegalStackParamList;

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  MarketplaceTab: NavigatorScreenParams<MarketplaceStackParamList> | undefined;
  WorkspaceTab: NavigatorScreenParams<WorkspaceStackParamList> | undefined;
  ModelsTab: undefined;
  DownloadsTab: undefined;
  ChatTab: undefined;
  PlaygroundTab: undefined;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
};
