import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "@/App";

const authMock = vi.hoisted(() => ({
  state: {
    user: { role: "user", uid: "test-user" },
    firebaseUser: {
      getIdTokenResult: vi.fn(async () => ({ claims: { role: "user" } })),
    },
    loading: false,
    isAuthenticated: true,
  },
  setRole(role: "admin" | "user") {
    this.state = {
      user: { role, uid: `test-${role}` },
      firebaseUser: {
        getIdTokenResult: vi.fn(async () => ({ claims: { role } })),
      },
      loading: false,
      isAuthenticated: true,
    };
  },
  setGuest() {
    this.state = {
      user: null,
      firebaseUser: null,
      loading: false,
      isAuthenticated: false,
    };
  },
  setStaleAdminToken() {
    this.state = {
      user: { role: "admin", uid: "test-admin" },
      firebaseUser: {
        getIdTokenResult: vi.fn(async () => ({ claims: { role: "user" } })),
      },
      loading: false,
      isAuthenticated: true,
    };
  },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => authMock.state,
}));

vi.mock("@/components/PwaInstallPrompt", () => ({
  default: () => null,
}));

vi.mock("@/pages/Passport", () => ({
  default: () => <div data-testid="page-passport">Passport</div>,
}));

vi.mock("@/pages/Destination", () => ({
  default: () => <div data-testid="page-destination">Destination</div>,
}));

vi.mock("@/pages/admin/DestinationList", () => ({
  default: () => (
    <div data-testid="page-admin-destinations">Admin Destinations</div>
  ),
}));

vi.mock("@/pages/admin/BlogList", () => ({
  default: () => <div data-testid="page-admin-blog-list">Admin Blog List</div>,
}));

vi.mock("@/pages/admin/BlogEdit", () => ({
  default: () => <div data-testid="page-admin-blog-edit">Admin Blog Edit</div>,
}));

vi.mock("@/pages/NotFound", () => ({
  default: () => <div data-testid="page-not-found">Not Found</div>,
}));

vi.mock("@/pages/Login", () => ({
  default: () => <div data-testid="page-login">Login</div>,
}));

function renderAt(pathname: string) {
  window.history.pushState({}, "", pathname);
  render(<App />);
}

describe("route regression coverage", () => {
  beforeEach(() => {
    authMock.setRole("user");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the public passport route", async () => {
    renderAt("/passport");

    const marker = await screen.findByTestId("page-passport");
    expect(marker).toBeTruthy();
  });

  it("renders dynamic passport destination routes", async () => {
    renderAt("/passport/tokyo");

    const marker = await screen.findByTestId("page-destination");
    expect(marker).toBeTruthy();
  });

  it("blocks admin routes for non-admin users", async () => {
    authMock.setRole("user");
    renderAt("/admin/destinations");

    const denied = await screen.findByText("Access Denied");
    expect(denied).toBeTruthy();
    expect(screen.queryByTestId("page-admin-destinations")).toBeNull();
  });

  it("renders admin routes for admin users", async () => {
    authMock.setRole("admin");
    renderAt("/admin/destinations");

    const marker = await screen.findByTestId("page-admin-destinations");
    expect(marker).toBeTruthy();
  });

  it("matches specific admin routes before generic /admin", async () => {
    authMock.setRole("admin");
    renderAt("/admin/blog/new");

    const editMarker = await screen.findByTestId("page-admin-blog-edit");
    expect(editMarker).toBeTruthy();
    expect(screen.queryByTestId("page-admin-blog-list")).toBeNull();
  });

  it("redirects guests to login when accessing admin routes", async () => {
    authMock.setGuest();
    renderAt("/admin/destinations");

    const marker = await screen.findByTestId("page-login");
    expect(marker).toBeTruthy();
  });

  it("denies access when user role is admin but token claim is stale", async () => {
    authMock.setStaleAdminToken();
    renderAt("/admin/destinations");

    const denied = await screen.findByText("Access Denied");
    expect(denied).toBeTruthy();
    expect(screen.queryByTestId("page-admin-destinations")).toBeNull();
  });

  it("renders 404 for unknown routes", async () => {
    renderAt("/this-route-does-not-exist");

    const marker = await screen.findByTestId("page-not-found");
    expect(marker).toBeTruthy();
  });
});
