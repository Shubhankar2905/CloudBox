---
name: cloudbox-ui
description: Build and improve CloudBox UI features using the existing shadcn/ui design system. Use whenever implementing or modifying dashboard, file management, folder navigation, sharing, uploads, dialogs, or other application UI.
---

# CloudBox UI Engineering Skill

## Project context

- Cloud storage and file-sharing application inspired by Google Drive.
- Next.js App Router, TypeScript, Tailwind CSS and shadcn/ui.
- Existing authentication, file APIs, folders, PostgreSQL/Prisma and private S3 storage must keep working.
- Inspect the repository before modifying components.

## Design principles

1. Use existing shadcn/ui primitives and installed dependencies first.
2. Preserve the existing visual identity unless a redesign is explicitly requested.
3. Use consistent spacing, typography, borders, radii, icon sizes and semantic theme tokens.
4. Prefer restrained, functional layouts over decorative UI.
5. Every element must serve a clear user task.
6. Use Lucide icons consistently; avoid emoji as interface icons.
7. Avoid unnecessary gradients, glassmorphism, excessive shadows, oversized headings, excessive rounded cards and gratuitous animations.
8. Do not invent new design patterns for individual pages when an existing pattern works.
9. Support desktop, tablet and mobile layouts.
10. Maintain keyboard accessibility, focus states, labels and appropriate contrast.

## Component rules

- Buttons: use existing Button variants and sizes.
- Navigation: use the existing Sidebar and navigation structure.
- File actions: use DropdownMenu or ContextMenu.
- Forms: use existing inputs with labels and validation messages.
- Confirm destructive actions with AlertDialog.
- Use Skeleton for loading states.
- Use Table for dense file lists and existing file components for grid views.
- Use Dialog or Sheet according to the interaction and screen size.
- Use existing design tokens rather than hard-coded colors.
- Do not duplicate existing primitives or install alternative UI libraries without justification.

## Implementation workflow

1. Inspect package.json, components.json, app structure, globals.css and relevant existing components.
2. Identify existing primitives and project conventions before installing anything.
3. Read the applicable shadcn skill and component documentation.
4. Reuse components and variants before introducing custom components.
5. Implement only the requested feature and necessary supporting changes.
6. Preserve API contracts, authentication, permissions and existing functionality.
7. Include loading, empty, error and success states where applicable.
8. Run linting, type checking and relevant tests.
9. Review the rendered UI for inconsistent spacing, overflow, accessibility and visual clutter.

## Definition of done

- The feature works, not just looks correct.
- Existing functionality remains intact.
- UI is consistent with the rest of CloudBox.
- No unnecessary dependencies, duplicated primitives or decorative elements.
- No placeholder data presented as real application data.
- No unfinished buttons or fake interactions.
