export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  google_id?: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  token_expiry?: string;
}

export interface DriveStorage {
  user: {
    email: string;
    display_name: string;
  };
  storage: {
    total_bytes: number;
    total_human: string;
    used_bytes: number;
    used_human: string;
    available_bytes: number;
    available_human: string;
    percentage_used: number;
    usage_breakdown: {
      drive_bytes: number;
      drive_human: string;
      trash_bytes: number;
      trash_human: string;
    };
  };
  unlimited: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  size_human: string;
  created_time: string;
  modified_time: string;
  web_view_link: string;
  thumbnail_link?: string;
  owners: any[];
}

export interface AuthState {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  tokens: GoogleTokens | null;
  isLoading: boolean;
}