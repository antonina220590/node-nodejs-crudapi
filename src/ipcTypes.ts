import type { NewUserInput } from "./types.js";
type UpdateUserRequestPayload = { id: string; data: NewUserInput };

export type WorkerRequestType =
  | "getAllUsers"
  | "getUserById"
  | "createUser"
  | "updateUser"
  | "deleteUser";

export interface WorkerRequestMessage {
  type: WorkerRequestType;
  payload?: unknown;
  requestId: string;
}
export interface PrimaryResponseMessage {
  type: string;
  requestId: string;
  payload?: unknown;
  error?: string | null;
}

export function isNewUserInput(payload: unknown): payload is NewUserInput {
  if (!payload || typeof payload !== "object") return false;
  return (
    "username" in payload &&
    typeof payload.username === "string" &&
    "age" in payload &&
    typeof payload.age === "number" &&
    "hobbies" in payload &&
    Array.isArray(payload.hobbies) &&
    payload.hobbies.every((h: unknown) => typeof h === "string")
  );
}

export function isUpdateUserPayload(
  payload: unknown
): payload is UpdateUserRequestPayload {
  if (!payload || typeof payload !== "object") return false;
  return (
    "id" in payload &&
    typeof payload.id === "string" &&
    "data" in payload &&
    isNewUserInput(payload.data)
  );
}
