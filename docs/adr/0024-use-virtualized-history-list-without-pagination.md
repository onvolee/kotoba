# Use a virtualized history list without pagination

Kotoba's first-version history drawer will show history records in chronological `createdAt` order without pagination. The list should use `@tanstack/react-virtual` so it can remain scroll-based while handling a growing local IndexedDB history. Search, filtering, pagination, and automatic cleanup remain out of scope for the first version.
