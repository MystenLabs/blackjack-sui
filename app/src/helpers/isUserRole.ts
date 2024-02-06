import { USER_ROLES } from "../constants/USER_ROLES";
import { UserRole } from "../types/Authentication";

export const isUserRole = (userRole: string): boolean => {
  return Object.values(USER_ROLES).includes(userRole as UserRole);
};
