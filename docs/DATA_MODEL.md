# Data Model — all 17 collections (Part 19)

| Collection | Key fields | Relationships |
|---|---|---|
| `users` | uid, fullName, email, role (`president`/`super_admin`/`assistant`/`member`/`pending`), createdAt | 1:1 with `member_profiles/{uid}`. Role is **never** client-writable. |
| `member_profiles` | uid, fullName, fatherName, address, skills, occupation, photoUrl, role, active | Owner = `users/{uid}`. Soft-delete via `active=false` only. |
| `private_identity` | uid, cnic, cnicFrontUrl, cnicBackUrl | Self + President/Super Admin only (rules). CNIC unique (Function check). |
| `president` | uid, fullName, cnic, fatherName, address, occupation, oathAgreed, oathText, oathAgreedAt | Single doc `president/president`. |
| `super_admins` | uid, fullName, active, approvedBy | Max 4 active (Function-enforced). |
| `assistant_admins` | uid, superAdminUid, fullName, active | Max 1 active per `superAdminUid`. |
| `registration_invitations` | tokenHash (SHA-256, never raw token), forRole, superAdminUid, createdBy, status (`active`/`used`/`expired`), expiresAt (7d), usedBy, usedAt | Redeemed once, in a transaction. |
| `super_admin_applications` | applicantUid, invitationId, fullName, status (`pending`/`approved`/`rejected`), decidedBy/At | President approves. |
| `assistant_applications` | applicantUid, superAdminUid, invitationId, status (`pending_super_admin` → `pending_president` → `approved`/`rejected`) | Stage 1 Super Admin, Stage 2 President. |
| `member_applications` | applicantUid, invitationId, fullName, status | President/Super Admin review. |
| `families` | headName, householdCount, headOccupation, status (`pending`/`approved`/`rejected`), createdBy, decidedBy/At | Head name is the record title. |
| `family_members` | familyId, relation (`son`/`daughter`/`other`), fullName, occupation, age | Many per `families/{id}`. |
| `family_categories` | familyId, category (`upper`/`middle`/`third`), votes, finalisedAt | Written only by `submitFamilyVote` at 3 matching votes. |
| `family_category_votes` | familyId, voterUid, category | Doc id = `{familyId}_{voterUid}` — one vote per Super Admin, enforced in rules + Function. |
| `widow_records` | widowName, address, notes, status | Kept inside the Families area, separate from Add Family. |
| `needy_people` | fullName, address, need, notes, active | Permanent record; never auto-deleted. |
| `sick_people` | personName, illness, familyId?, memberUid?, active, removedBy/At | Removal sets `active=false` only — family/member docs untouched. |
| `approval_records` | kind, targetId, byUid, decision, note, createdAt | Audit trail for every approval/rejection/removal. |
| `role_history` | uid, fromRole, toRole, changedBy, reason, createdAt | Audit trail for dismissals and role changes. |
| `system/bootstrap` | presidentExists, presidentUid | Readable by all, writable by nobody client-side. |

No sample/fake member or family records exist anywhere in the code — lists
render empty states until real data is created through the real flows.
