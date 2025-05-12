import * as userStore from "../data/userStore.js";
import { User } from "../types.js";

export const getAllUsers = async (): Promise<User[]> => {
  const users = await userStore.findAllUsersAsync();
  return users;
};
