---
description: Create project plan using project-planner agent. No code writing - only plan file generation.
---

# /plan - Project Planning Mode

$ARGUMENTS

---

## 🔴 CRITICAL RULES

1. **NO CODE WRITING** - This command creates plan file only
2. **Use project-planner agent** - NOT Antigravity Agent's native Plan mode
3. **Socratic Gate** - Ask clarifying questions before planning
4. **Dynamic Naming** - Plan file named based on task

---

## Task

Use the `project-planner` agent with this context:

```
CONTEXT:
- User Request: $ARGUMENTS
- Mode: PLANNING ONLY (no code)
- Output: docs/features/{feature-name}/{TASK-SLUG}-PLAN.md (dynamic naming)

NAMING RULES:
1. Extract 2-3 key words from request
2. Lowercase, hyphen-separated
3. Max 30 characters
4. Example: "e-commerce cart" → PLAN-ecommerce-cart.md

RULES:
1. Follow project-planner.md Phase -1 (Context Check)
2. Follow project-planner.md Phase 0 (Socratic Gate)
3. Create PLAN-{slug}.md with task breakdown
4. DO NOT write any code files
5. REPORT the exact file name created
```

---

## Expected Output

| Deliverable            | Location                                           |
| ---------------------- | -------------------------------------------------- |
| Project Plan           | `docs/features/{feature-name}/{TASK-SLUG}-PLAN.md` |
| Task Breakdown         | Inside plan file                                   |
| Agent Assignments      | Inside plan file                                   |
| Verification Checklist | Phase X in plan file                               |

---

## After Planning

Tell user:

```
[OK] Plan created: docs/features/{feature-name}/{TASK-SLUG}-PLAN.md

Next steps:
- Review the plan
- Run `/create` to start implementation
- Or modify plan manually
```

---

## Naming Examples

| Request                         | Plan File                                        |
| ------------------------------- | ------------------------------------------------ |
| /plan e-commerce site with cart | `docs/features/ecommerce/ecommerce-cart-PLAN.md` |
| /plan mobile app for fitness    | `docs/features/fitness/fitness-app-PLAN.md`      |
| /plan add dark mode feature     | `docs/features/dark-mode/dark-mode-PLAN.md`      |
| /plan fix authentication bug    | `docs/features/auth/auth-fix-PLAN.md`            |
| /plan SaaS dashboard            | `docs/features/dashboard/saas-dashboard-PLAN.md` |

---

## Usage

```
/plan e-commerce site with cart
/plan mobile app for fitness tracking
/plan SaaS dashboard with analytics
```
