// Export all types
export * from "./services/types";

// Export all services
export * from "./services/blog";
export * from "./services/video";
export * from "./services/photo";
export * from "./services/category";
export * from "./services/schedule";
export * from "./services/user";
export * from "./services/feed";
export * from "./services/newsletter";
export * from "./services/contact";
export * from "./services/ai";

// Re-export specific helpers if needed by legacy code (though they are internal to services now)
// But for safety, let's keep the API surface identical.
export { db } from "./services/common";
export * from "./services/destination";
