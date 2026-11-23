# 5. PeopleSoft security

Security tickets are a separate **issue area** because they are handled by the security administrator,
follow approval rules, and often carry audit requirements.

Sources: [Oracle: Understanding PeopleSoft Security (HCM 9.2)](https://docs.oracle.com/cd/G40410_01/hcm92pbr53/eng/hcm/hhaf/UnderstandingPeopleSoftSecurity-e32979.html),
[Understanding PeopleTools Security (FSCM 9.2)](https://docs.oracle.com/cd/G47724_01/fscm92pbr55/eng/fscm/fprc/UnderstandingPeopleToolsSecurity-9f3317.html),
[Understanding PeopleSoft Application Security (FSCM 9.2)](https://docs.oracle.com/cd/G17334_01/fscm92pbr52/eng/fscm/fspf/UnderstandingPeopleSoftApplicationSecurity-9f1518.html),
[PeopleTools Security Basics (8.59)](https://docs.oracle.com/cd/F86650_01/pt859pbr5/eng/pt/tsec/SecurityBasics-c07658.html),
[PeopleSoft delivered security roles and permissions (Oracle blog)](https://blogs.oracle.com/peoplesoft/peoplesoft-delivered-security-roles-and-permissions).

## Building blocks

| Object | What it controls |
|---|---|
| **Permission list** | The base unit of access: which components, pages and actions are allowed. Defined first. |
| **Role** | A collection of permission lists. Users get most access through roles. |
| **User profile** | A user ID with roles plus directly assigned permission lists. A user's access is the union of everything assigned. |
| **Primary permission list / row security permission list** | Assigned directly to the user, not through roles. Controls **row-level (data) security**, for example which departments or business units a user can see. |
| **Department security tree** (HCM) | Drives which employees a user can see. Changes need a security refresh (SJT tables) before they take effect. |

Important behaviors that show up in tickets:

- Changing a permission list changes access for **every** user with a role that contains it.
- Row-level security is not built by combining roles. It comes from the user's row security settings.
- Row-level security does **not** restrict data selected by batch processes.

## Common ticket patterns

| Pattern | Typical wording | Usual handling |
|---|---|---|
| New access | "needs access to", "add role", "new user setup" | Approval, then role assignment |
| Access error | "not authorized to access this component", "permission error" | Check roles / permission lists |
| Can't see data | "can't see employees in department", "missing from search" | Row security, security tree refresh |
| Transfer / role change | "moved to", "transferred", "replace roles" | Remove old roles, add new ones |
| Separation | "separated", "terminated", "last day", "remove access", "disable", "lock" | Lock account, remove roles (often high priority) |
| Audit | "list of users with role", "quarterly access review" | Report or query |

## Implications for the application

- Separation and lock requests should get a **high suggested priority**.
- Security tickets often contain user IDs and employee names. In real data these are confidential, which is
  one more reason the public app runs on synthetic data only (see [data-handling.md](data-handling.md)).
