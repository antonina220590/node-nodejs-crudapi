import { v4 as uuidv4 } from "uuid";
import { NewUserInput, User } from "../types.js";

let users: User[] = [
  {
    id: uuidv4(),
    username: "Kate",
    age: 40,
    hobbies: ["hiking, horse riding"],
  },
  {
    id: uuidv4(),
    username: "Nick",
    age: 26,
    hobbies: ["climbing, reading"],
  },
];

export const findAllUsersAsync = async (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...users]);
    }, 10);
  });
};

export const findUserByIdAsync = async (
  id: string
): Promise<User | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = users.find((u) => u.id === id);
      resolve(user ? { ...user } : undefined);
    }, 10);
  });
};

export const saveUserAsync = async (userData: NewUserInput): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUserWithId: User = {
        id: uuidv4(),
        ...userData,
      };
      users.push(newUserWithId);
      resolve({ ...newUserWithId });
    }, 10);
  });
};

export const updateUserInStoreAsync = async (
  id: string,
  updates: NewUserInput
): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userIndex = users.findIndex((u) => u.id === id);

      if (userIndex === -1) {
        resolve(null);
      } else {
        const updatedUser: User = {
          ...users[userIndex],
          ...updates,
        };
        users[userIndex] = updatedUser;
        resolve({ ...updatedUser });
      }
    }, 10);
  });
};

export const deleteUserFromStoreAsync = async (
  id: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initialLength = users.length;
      users = users.filter((u) => u.id !== id);
      const success = users.length < initialLength;
      resolve(success);
    }, 10);
  });
};
