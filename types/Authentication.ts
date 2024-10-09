export type UserRole = "admin" | "moderator" | "member" | "anonymous";

export interface UserProps {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  picture: string;
}

export interface AuthenticationContextProps {
  user: UserProps;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  handleLoginAs: (user: UserProps) => void;
  handleLogout: () => void;
}
