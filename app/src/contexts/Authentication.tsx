import { ReactElement, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthenticationContextProps,
  UserProps,
  UserRole,
} from "@/types/Authentication";
import { createContext } from "react";
import { ChildrenProps } from "@/types/ChildrenProps";

export const anonymousUser: UserProps = {
  id: "",
  firstName: "",
  lastName: "",
  role: "anonymous",
  email: "",
};

export const useAuthentication = () => {
  const context = useContext(AuthenticationContext);
  return context;
};

export const AuthenticationContext = createContext<AuthenticationContextProps>({
  user: anonymousUser,
  isLoading: false,
  handleLoginAs: () => {},
  handleLogout: () => {},
});

export const AuthenticationProvider = ({ children }: ChildrenProps) => {
  const router = useRouter();

  const [user, setUser] = useState<UserProps>(anonymousUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initialUser = localStorage.getItem("user");
    if (initialUser) {
      setUser(JSON.parse(initialUser));
    } else {
      setUser(anonymousUser);
    }
    setIsLoading(false);
  }, []);

  const handleLoginAs = (role: UserRole) => {
    const newUser = {
      id: "123",
      firstName: "John",
      lastName: "Doe",
      role,
      email: `john.${role}@gmail.com`,
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    router.push(`/${role}`);
  };

  const handleLogout = () => {
    setUser(anonymousUser);
    localStorage.setItem("user", JSON.stringify(anonymousUser));
    router.push("/");
  };

  return (
    <AuthenticationContext.Provider
      value={{ user, isLoading, handleLoginAs, handleLogout }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};
