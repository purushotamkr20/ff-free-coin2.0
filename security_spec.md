# Security Specifications & Rules Verification Spec

## 1. Data Invariants
1. **User Ownership**: A user profile belongs exclusively to the owner identified by the mobile number document ID. No user may write or manipulate another user's coin balance or profile properties.
2. **Settings Isolation**: App settings are global read-only to normal clients. Only the master root admin profile can modify settings, UPI configurations, or promotion lists.
3. **Transaction Integrity**: Financial requests (deposits and withdrawals) cannot be updated or modified once in a terminal state (completed).
4. **Game Configurations**: Game and Match configurations can only be created, modified, or deleted by authorized administrators.

## 2. The "Dirty Dozen" Malicious Payloads
Here are 12 specific payloads attempting to break Identity, Integrity, and state:
1. **Identity Spoofing Users**: Attacker tries to write a node in `/users/0000000000` claiming to be logged in as `9693908559`.
2. **Coin Injection**: Attacker tries to set their own `coins` balance to `999999` in a user update block.
3. **State Shortcutting of Financial Request**: Attacker attempts to change a request status directly to `completed` without admin permission.
4. **Shadow Field Injection**: Attacker includes a "Ghost Field" `isAdmin: true` inside a User profile registration.
5. **Admin Settings Overwrite**: Attacker tries to modify `/settings/appSettings` to point the QR code and UPI ID to their own wallet.
6. **Poison Match Entry fee**: Attacker tries to update entry fees of an active game to `0` to join for free.
7. **Bypass Join Capacity**: Attacker tries to increment `joinedPlayers` to arbitrary counts beyond the max limit of `20`.
8. **Malicious Match Hijack**: Attacker tries to modify/delete tournament matchups of games they do not own.
9. **Junk Input Flooding**: Attacker attempts to inject 2MB long junk strings as a mobile number.
10. **Tampered Timestamps**: Attacker sets a future timestamp `Date.now() + 1000000` instead of a true server-side date.
11. **Bypassing Verification status**: Attacker signs in with an unverified email address and tries to perform admin actions.
12. **Foreign Transaction Creation**: Attacker attempts to post a financial transaction identifying another user's mobile number.

## 3. Automated Rule Verification Strategy
All attempts to execute operations matching the above payloads will be denied synchronously at the database layer. We will enforce strict schemas and structural security in `firestore.rules`.
