# Use internal hash routing

Kotoba will use a small internal hash-routing model for workspace pages instead of adding React Router or TanStack Router in the first version. The known routes are limited to the translation workspace and settings page, so a full routing library would add more surface area than value. Hash routes also preserve page state across refreshes inside the extension-owned tab without requiring server-style route handling.
