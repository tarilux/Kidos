# Security Specification for Kidos

## Data Invariants
- A `Task` must belong to a `Family`.
- A `Reward` must belong to a `Family`.
- A `User` must be part of a `Family` to see its tasks/rewards.
- Only a `Parent` can create/delete tasks and rewards.
- Kids can only mark tasks as `completed`.
- Parents must `verify` tasks for points to be awarded (handled in app logic, but rules should restrict who can set status to `verified`).

## The Dirty Dozen Payloads (Deny cases)
1. Creating a family with an `adminId` that isn't the current user.
2. Updating someone else's `UserProfile`.
3. A kid creating a `Task`.
4. A kid deleting a `Task`.
5. A kid updating a `Task` status to `verified`.
6. A user reading tasks of a family they don't belong to.
7. Creating a task with a massive title (1MB).
8. Updating a user's `points` directly by a kid.
9. Deleting a `Family` by a non-admin.
10. Creating a `Reward` by a kid.
11. Reading the private `inviteCode` of another family.
12. Injecting a malicious script into a task description.

## Test Runner (Draft)
A `firestore.rules.test.ts` would be used to verify these. I will proceed with rule generation now.
