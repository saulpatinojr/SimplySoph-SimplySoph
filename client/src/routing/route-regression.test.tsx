import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "@/App";

const authMock = vi.hoisted(() => ({
  state: {
    user: { role: "user", uid: "test-user" } as { role: string; uid: string } | null,
    firebaseUser: {
      getIdTokenResult: vi.fn(async () => ({ claims: { role: "user" } })),
    } as { getIdTokenResult: () => Promise<{ claims: { role: string } }> } | null,
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

vi.mock("@/pages/admin/DestinationEdit", () => ({
  default: () => (
    <div data-testid="page-admin-destination-edit">Admin Destination Edit</div>
  ),
}));

vi.mock("@/pages/admin/BlogList", () => ({
  default: () => <div data-testid="page-admin-blog-list">Admin Blog List</div>,
}));

vi.mock("@/pages/admin/BlogEdit", () => ({
  default: () => <div data-testid="page-admin-blog-edit">Admin Blog Edit</div>,
}));

vi.mock("@/pages/Menagerie", () => ({
  default: () => <div data-testid="page-menagerie">Menagerie</div>,
}));

vi.mock("@/pages/MenagerieDetail", () => ({
  default: () => <div data-testid="page-menagerie-detail">Menagerie Detail</div>,
}));

vi.mock("@/pages/Looks", () => ({
  default: () => <div data-testid="page-looks">Looks</div>,
}));

vi.mock("@/pages/LookDetail", () => ({
  default: () => <div data-testid="page-look-detail">Look Detail</div>,
}));

vi.mock("@/pages/admin/MenagerieList", () => ({
  default: () => <div data-testid="page-admin-menagerie">Admin Menagerie</div>,
}));

vi.mock("@/pages/admin/LookList", () => ({
  default: () => <div data-testid="page-admin-looks">Admin Looks</div>,
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

  it("handles trailing slash on public routes consistently", async () => {
    renderAt("/passport/");

    const marker = await screen.findByTestId("page-passport");
    expect(marker).toBeTruthy();
  });

  it("handles query/hash variants on public routes", async () => {
    renderAt("/passport?view=map#top");

    const marker = await screen.findByTestId("page-passport");
    expect(marker).toBeTruthy();
  });

  it("renders dynamic passport destination routes", async () => {
    renderAt("/passport/tokyo");

    const marker = await screen.findByTestId("page-destination");
    expect(marker).toBeTruthy();
  });

  it("handles query/hash variants on dynamic public routes", async () => {
    renderAt("/passport/tokyo?from=feed#gallery");

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

  it("keeps protected-route redirect behavior with query/hash", async () => {
    authMock.setGuest();
    renderAt("/admin/destinations?tab=pending#queue");

    const marker = await screen.findByTestId("page-login");
    expect(marker).toBeTruthy();
  });

  it("keeps protected-route redirect behavior with trailing slash", async () => {
    authMock.setGuest();
    renderAt("/admin/destinations/");

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

  it("promotes access when admin claim transitions from user to admin", async () => {
    authMock.setRole("user");
    renderAt("/admin/destinations");

    const denied = await screen.findByText("Access Denied");
    expect(denied).toBeTruthy();

    cleanup();
    authMock.setRole("admin");
    renderAt("/admin/destinations");

    const allowed = await screen.findByTestId("page-admin-destinations");
    expect(allowed).toBeTruthy();
  });

  it("revokes access when admin claim transitions from admin to user", async () => {
    authMock.setRole("admin");
    renderAt("/admin/destinations");

    const allowed = await screen.findByTestId("page-admin-destinations");
    expect(allowed).toBeTruthy();

    cleanup();
    authMock.setRole("user");
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

  it("renders the normalized destination edit route", async () => {
    authMock.setRole("admin");
    renderAt("/admin/destinations/edit/abc123");

    const marker = await screen.findByTestId("page-admin-destination-edit");
    expect(marker).toBeTruthy();
  });

  it("redirects legacy /admin/destinations/:id to the edit route", async () => {
    authMock.setRole("admin");
    renderAt("/admin/destinations/abc123");

    const marker = await screen.findByTestId("page-admin-destination-edit");
    expect(marker).toBeTruthy();
    expect(window.location.pathname).toBe("/admin/destinations/edit/abc123");
  });

  it("matches /admin/destinations/new before the legacy :id redirect", async () => {
    authMock.setRole("admin");
    renderAt("/admin/destinations/new");

    const marker = await screen.findByTestId("page-admin-destination-edit");
    expect(marker).toBeTruthy();
    expect(window.location.pathname).toBe("/admin/destinations/new");
  });

  it("carries the requested admin path through the login redirect", async () => {
    authMock.setGuest();
    renderAt("/admin/blog/new");

    const marker = await screen.findByTestId("page-login");
    expect(marker).toBeTruthy();
    expect(window.location.search).toContain(
      `redirect=${encodeURIComponent("/admin/blog/new")}`
    );
  });

  it("404s the removed bare /admin/blog/edit route", async () => {
    authMock.setRole("admin");
    renderAt("/admin/blog/edit");

    const marker = await screen.findByTestId("page-not-found");
    expect(marker).toBeTruthy();
  });

  it("renders the public menagerie and looks routes", async () => {
    renderAt("/menagerie");
    expect(await screen.findByTestId("page-menagerie")).toBeTruthy();
    cleanup();

    renderAt("/menagerie/bartholomew");
    expect(await screen.findByTestId("page-menagerie-detail")).toBeTruthy();
    cleanup();

    renderAt("/looks");
    expect(await screen.findByTestId("page-looks")).toBeTruthy();
    cleanup();

    renderAt("/looks/airport-set");
    expect(await screen.findByTestId("page-look-detail")).toBeTruthy();
  });

  it("gates the menagerie and looks admin sections", async () => {
    authMock.setRole("user");
    renderAt("/admin/menagerie");
    expect(await screen.findByText("Access Denied")).toBeTruthy();
    cleanup();

    authMock.setRole("admin");
    renderAt("/admin/menagerie");
    expect(await screen.findByTestId("page-admin-menagerie")).toBeTruthy();
    cleanup();

    renderAt("/admin/looks");
    expect(await screen.findByTestId("page-admin-looks")).toBeTruthy();
  });
});
