# Firebase Security Specification

## Data Invariants
1. A Product must have a name, an assignee, and a status.
2. A Product must contain a `plans` map and a `history` map for the week.
3. Only authenticated users can read or write data.

## The "Dirty Dozen" Payloads (Deny Cases)
1. Creating a product without `productName`.
2. Updating `productName` with a string longer than 100 characters.
3. Injecting a "Ghost Field" (e.g., `isAdmin: true`) in a product update.
4. Setting `status` to an invalid value (e.g., `Done`).
5. Updating a product's ID path with a 2KB string.
6. Deleting a config document if not signed in (global deny handles this).
7. Modifying `updatedAt` to a client-provided time (should use `request.time`).
8. Updating a product with an array instead of a map for `plans`.
9. Skipping `isSignedIn()` check for `read` access.
10. Attempting to update a restricted field (e.g., `id` or `createdAt` if we had it) during a status update.
11. Providing an empty string for `assignee`.
12. Setting `quantity` (in plans) to a negative number.

## Test Runner (Logic Check)
The `firestore.rules` will be tested using the Firestore Emulator/ESLint to ensure these invariants are enforced.
