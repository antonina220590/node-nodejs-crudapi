import { v4 as uuidv4 } from "uuid";
import { NewUserInput, User } from "../types.js";

const users: User[] = [
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

export const saveUserAsync = async (newUser: User): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      users.push(newUser);
      resolve({ ...newUser });
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
