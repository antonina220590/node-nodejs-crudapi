import request from "supertest";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

describe("CRUD API Endpoints Test Suite", () => {
  let createdUserId: string;
  const initialUser = {
    username: "Test User Initial",
    age: 99,
    hobbies: ["base"],
  };
  const userToCreate = {
    username: "Test User Jest",
    age: 50,
    hobbies: ["jest", "testing"],
  };
  const userToUpdate = {
    username: "Test User Jest Updated",
    age: 51,
    hobbies: ["jest", "supertest"],
  };

  describe("Full CRUD Cycle Scenario", () => {
    let initialUsers: any[] = [];

    it("1. GET /api/users - should get initial users", async () => {
      const response = await request(BASE_URL).get("/api/users");
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      initialUsers = response.body;
      console.log("Initial users count:", initialUsers.length);
    });

    it("2. POST /api/users - should create a new user", async () => {
      const response = await request(BASE_URL)
        .post("/api/users")
        .send(userToCreate);

      expect(response.status).toBe(201);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty("id");
      expect(response.body.username).toBe(userToCreate.username);
      expect(response.body.age).toBe(userToCreate.age);
      expect(response.body.hobbies).toEqual(userToCreate.hobbies);

      createdUserId = response.body.id;
    });

    it("3. GET /api/users/{userId} - should get the created user by ID", async () => {
      expect(createdUserId).toBeDefined();
      const response = await request(BASE_URL).get(
        `/api/users/${createdUserId}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body.id).toBe(createdUserId);
      expect(response.body.username).toBe(userToCreate.username);
    });

    it("4. PUT /api/users/{userId} - should update the created user", async () => {
      expect(createdUserId).toBeDefined();
      const response = await request(BASE_URL)
        .put(`/api/users/${createdUserId}`)
        .send(userToUpdate);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body.id).toBe(createdUserId);
      expect(response.body.username).toBe(userToUpdate.username);
      expect(response.body.age).toBe(userToUpdate.age);
      expect(response.body.hobbies).toEqual(userToUpdate.hobbies);
    });

    it("5. DELETE /api/users/{userId} - should delete the created user", async () => {
      expect(createdUserId).toBeDefined();
      const response = await request(BASE_URL).delete(
        `/api/users/${createdUserId}`
      );

      expect(response.status).toBe(204);
    });

    it("6. GET /api/users/{userId} - should respond with 404 for the deleted user", async () => {
      expect(createdUserId).toBeDefined();
      const response = await request(BASE_URL).get(
        `/api/users/${createdUserId}`
      );

      expect(response.status).toBe(404);
    });

    it("7. GET /api/users - should not contain the deleted user", async () => {
      const response = await request(BASE_URL).get("/api/users");
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const deletedUserFound = response.body.find(
        (user: any) => user.id === createdUserId
      );
      expect(deletedUserFound).toBeUndefined();
    });
  });

  describe("Error Handling Scenarios", () => {
    it("GET /api/users/{userId} - should return 400 for invalid UUID", async () => {
      const response = await request(BASE_URL).get(
        "/api/users/this-is-not-a-valid-uuid"
      );
      expect(response.status).toBe(400);
    });

    it("POST /api/users - should return 400 if required fields are missing", async () => {
      const response = await request(BASE_URL)
        .post("/api/users")
        .send({ username: "Only Username" });
      expect(response.status).toBe(400);
    });

    it("POST /api/users - should return 400 if fields have incorrect types", async () => {
      const response = await request(BASE_URL).post("/api/users").send({
        username: "Bad Types",
        age: "not a number",
        hobbies: "not an array",
      });
      expect(response.status).toBe(400);
    });

    it("PUT /api/users/{userId} - should return 400 for invalid UUID", async () => {
      const response = await request(BASE_URL)
        .put("/api/users/invalid-uuid")
        .send(userToUpdate);
      expect(response.status).toBe(400);
    });

    it("DELETE /api/users/{userId} - should return 400 for invalid UUID", async () => {
      const response = await request(BASE_URL).delete(
        "/api/users/invalid-uuid"
      );
      expect(response.status).toBe(400);
    });
  });

  describe("Additional Scenarios", () => {
    it("GET /non-existent-path - should return 404", async () => {
      const response = await request(BASE_URL).get(
        "/some/random/non/existent/path"
      );
      expect(response.status).toBe(404);
    });
  });
});
