import type { User, NewUserInput } from "../types.js";
import * as memoryStore from "../data/userStoreMemory.js";
import * as ipcStore from "../data/userStore.js";
import process from "node:process";

const useIPC = !!process.send;
const store = useIPC ? ipcStore : memoryStore;

console.log(`UserService uses ${useIPC ? "IPC Store" : "Memory Store"}`);

export const getAllUsers = async (): Promise<User[]> => {
  return store.findAllUsersAsync();
};

export const fetchUserById = async (
  userId: string,
): Promise<User | undefined> => {
  return store.findUserByIdAsync(userId);
};

export const addNewUser = async (userData: NewUserInput): Promise<User> => {
  return store.saveUserAsync(userData);
};

export const modifyUser = async (
  userId: string,
  userDataToUpdate: NewUserInput,
): Promise<User | null> => {
  return store.updateUserInStoreAsync(userId, userDataToUpdate);
};

export const removeUserById = async (userId: string): Promise<boolean> => {
  return store.deleteUserFromStoreAsync(userId);
};
