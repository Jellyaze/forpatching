export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  HomeTabs: undefined;
  CreatePost: undefined;
  EditPost: { postId: string };
  ViewPost: { postId: string };
  Chat: { conversationId: string; otherUserId: string };
  ConfirmClaim: { postId: string; claimId: string };
  VerifyReturn: { claimId: string };
  ProfileDetails: undefined;
  NotificationSettings: undefined;
  Settings: undefined;
  MapCreatePost: { onLocationSelect: (location: any) => void };
  MapViewPost: { latitude: number; longitude: number; title: string };
  AdvancedSearch: undefined;
  SearchResults: { query?: string; filters?: any };
};

export type BottomTabParamList = {
  Home: undefined;
  MyPosts: undefined;
  Messages: undefined;
  Profile: undefined;
};