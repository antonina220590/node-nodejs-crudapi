import * as userStore from "../data/userStore.js";
import { User } from "../types.js";

export const getAllUsers = async (): Promise<User[]> => {
  const users = await userStore.findAllUsersAsync();
  return users;
};

export const fetchUserById = async (
  userId: string
): Promise<User | undefined> => {
  const user = await userStore.findUserByIdAsync(userId);
  return user;
};
