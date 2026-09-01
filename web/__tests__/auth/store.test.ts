import { useAuthStore } from "@/lib/store/useAuthStore";
import { authApi } from "@/lib/api/auth";

jest.mock("@/lib/api/auth");

describe("Auth Store (useAuthStore)", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    jest.clearAllMocks();
  });

  it("should initialize with default unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should handle successful login action", async () => {
    const mockUser = {
      id: "123",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      role: "CUSTOMER" as const,
      is_active: true,
      is_verified: true,
    };

    (authApi.login as jest.Mock).mockResolvedValueOnce({
      access_token: "mock-jwt-token",
      token_type: "bearer",
      user: mockUser,
    });

    const user = await useAuthStore.getState().login({
      email: "john@example.com",
      password: "Password123!",
    });

    const state = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("mock-jwt-token");
  });

  it("should handle logout action and clear state", async () => {
    (authApi.logout as jest.Mock).mockResolvedValueOnce({ message: "Successfully logged out" });

    useAuthStore.setState({
      user: {
        id: "123",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        role: "CUSTOMER",
        is_active: true,
        is_verified: true,
      },
      accessToken: "mock-jwt-token",
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
