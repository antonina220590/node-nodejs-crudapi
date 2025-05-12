import * as userStore from "../data/userStore.js";
import { User } from "../types.js";
import { v4 as uuidv4 } from "uuid";

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

export const addNewUser = async (userData: Omit<User, "id">): Promise<User> => {
  const newUserId = uuidv4();

  const newUser: User = {
    id: newUserId,
    ...userData,
  };

  const savedUser = await userStore.saveUserAsync(newUser);
  return savedUser;
};
