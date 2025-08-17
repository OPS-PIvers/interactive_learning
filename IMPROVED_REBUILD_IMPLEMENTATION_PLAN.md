# Actionable Rebuild Plan for ExpliCoLearning

## 1. Executive Summary

This document outlines a comprehensive, phased plan for rebuilding the ExpliCoLearning application. The primary goal is to create a modern, maintainable, and high-performing application with an exceptional user experience, built upon a **Unified Responsive Architecture**. This plan replaces a sprawling 132-component codebase with a streamlined, "hotspot-only" architecture that is simpler to develop and easier for users to understand.

This is a living document that will be used to track progress. Each phase includes actionable checklists and a clear "Definition of Done" to ensure quality and alignment at every stage.

## 2. Guiding Principles (Mandatory)

This rebuild will strictly adhere to the principles outlined in `AGENTS.md`. All development must follow these non-negotiable rules:

- **Unified Responsive Architecture:** One component must adapt to all screen sizes.
- **CSS-First Design:** Responsiveness will be handled exclusively by Tailwind CSS breakpoints (`sm:`, `md:`, `lg:`).
- **NO JavaScript Branching for UI:** Device detection (`useDeviceDetection`) is **only** for mathematical calculations (e.g., canvas coordinates), not for rendering different components or styles.
- **NO Separate Mobile/Desktop Components:** All components must be unified.
- **Centralized Z-Index:** All `z-index` values must come from `src/client/utils/zIndexLevels.ts`.
- **Hotspot-Only Architecture:** All interactive elements (text, media, shapes) will be implemented as effects triggered by a single, universal hotspot element.

---

## 3. Project Phases & Actionable Checklists

### Phase 1: Design System & Foundation (Weeks 1-2)

**Goal:** Establish the visual and architectural foundation of the entire application.

**Key Outcomes:**
- A comprehensive set of design tokens (colors, typography, spacing).
- A library of reusable, responsive, and accessible primitive components.
- A standardized icon and layout system.

**Actionable Checklist:**
- [ ] Define color palette, typography scale, and spacing system in `src/design/DesignSystem.ts`.
- [ ] Create primitive `Button` component with variants and sizes.
- [ ] Create primitive `Card` component with variants.
- [ ] Create primitive `Modal` component with variants.
- [ ] Implement a standardized `Icon` system using Lucide React.
- [ ] Create layout primitives: `Container`, `Stack`, `Flex`, `Grid`.
- [ ] Set up project-wide ESLint rules to enforce code style.
- [ ] Configure Tailwind CSS with the new design tokens.

**Definition of Done:**
- [ ] All design tokens are defined and implemented.
- [ ] All primitive components are built, tested, and documented.
- [ ] All layout components are built and tested.
- [ ] **Stakeholder Review:** Design system and primitives are approved by the design and product teams.
- [ ] All code passes linting and unit tests with >95% coverage.

---

### Phase 2: Core Application Shell (Week 3)

**Goal:** Build the main application layout and navigation structure.

**Key Outcomes:**
- A responsive application shell with a header, footer, and main content area.
- A complete and responsive navigation system.
- Robust loading, empty, and error states.

**Actionable Checklist:**
- [ ] Create `AppShell.tsx` to define the main application layout.
- [ ] Implement `TopNavigation.tsx` and `SideNavigation.tsx`.
- [ ] Implement `BreadcrumbNav.tsx` for contextual navigation.
- [ ] Create a `LoadingSpinner` component.
- [ ] Create a reusable `Skeleton` component for content placeholders.
- [ ] Create a reusable `EmptyState` component.
- [ ] Implement a global `ErrorBoundary` component.

**Definition of Done:**
- [ ] The application shell is fully responsive on all breakpoints.
- [ ] All navigation components are implemented and functional.
- [ ] Loading, skeleton, and empty states are implemented and ready for use.
- [ ] **Stakeholder Review:** App shell and navigation are approved.
- [ ] All code passes linting and unit tests with >95% coverage.

---

### Phase 3: Project Management UI (Week 4)

**Goal:** Implement the user's project dashboard and management workflows.

**Actionable Checklist:**
- [ ] Build the `ProjectDashboard.tsx` view.
- [ ] Create the `ProjectCard.tsx` component.
- [ ] Implement project filtering and sorting functionality.
- [ ] Build the multi-step `CreateProjectWizard.tsx`.
- [ ] Connect the UI to Firebase for fetching and creating projects (using mock data initially).

**Definition of Done:**
- [ ] Users can view a list of their projects.
- [ ] Users can create a new project through the wizard.
- [ ] The entire project management interface is fully responsive.
- [ ] All code passes linting and component tests with >95% coverage.

---

### Phase 4: Slide Editor Foundation (Weeks 5-6)

**Goal:** Build the core layout and canvas for the slide editor.

**Actionable Checklist:**
- [ ] Create the main `EditorLayout.tsx` with its three-panel structure.
- [ ] Implement the `EditorToolbar.tsx`.
- [ ] Implement the `SlideNavigationPanel.tsx`.
- [ ] Implement the `PropertiesPanel.tsx`.
- [ ] Build the core `Canvas.tsx` component with grid and rulers.
- [ ] Implement zoom and pan functionality for the canvas.
- [ ] Implement element selection and resizing controls.

**Definition of Done:**
- [ ] The editor layout is fully implemented and responsive.
- [ ] The canvas can be zoomed and panned.
- [ ] Placeholder elements can be selected, moved, and resized on the canvas.
- [ ] **Stakeholder Review:** The core editor experience is approved.
- [ ] All code passes linting and component tests with >95% coverage.

---
_The remaining phases would follow a similar, detailed, and actionable structure._
- **Phase 5: Hotspot System Implementation (Week 7)**
- **Phase 6: Content & Interaction Effects System (Weeks 8-9)**
- **Phase 7: Viewer Experience (Weeks 10-11)**
- **Phase 8: Mobile Experience & Touch Polish (Week 12)**
- **Phase 9: Performance, Accessibility & Polish (Weeks 13-14)**
- **Phase 10: Data Migration & Launch (Week 15)**

---

## 4. Success Metrics

| Category  | Metric                                      | Target                               |
| :-------- | :------------------------------------------ | :----------------------------------- |
| **Tech**  | Component Count                             | From 132 down to ~25-30              |
|           | Element Complexity                          | 4 types to 1 (Hotspot)               |
|           | Code Duplication (Mobile/Desktop)           | 100% eliminated                      |
|           | TypeScript Coverage                         | 100% strict                          |
|           | Test Coverage                               | > 95%                                |
|           | Page Load Time (LCP)                        | < 2.0s                               |
|           | Lighthouse Score                            | 95+ on all categories                |
| **UX**    | Clicks for common tasks                     | 50% reduction                        |
|           | First-time user experience                  | Intuitive, with minimal guidance     |
|           | Accessibility                               | WCAG 2.1 AA compliant                |
|           | Animations & Interactions                   | Smooth 60fps                         |

## 5. Risk Management

| Risk Category | Risk Description                               | Mitigation Strategy                                        |
| :-------------- | :--------------------------------------------- | :--------------------------------------------------------- |
| **Technical**   | Data loss during migration.                    | - Comprehensive backup of all production data.<br>- Write and test a migration script in a staging environment.<br>- Perform a dry run before final migration. |
|                 | Performance regressions.                       | - Automate performance testing in CI/CD pipeline.<br>- Set performance budgets for key metrics. |
| **Timeline**    | Scope creep introduces new features.           | - Strict adherence to the feature set defined in this plan.<br>- All changes require approval from product owner.<br>- Defer new ideas to a "version 2" backlog. |
| **Adoption**    | Users are resistant to the new interface.      | - Involve users in beta testing from Phase 7 onwards.<br>- Create clear documentation and tutorials.<br>- Provide in-app guided tours for new features. |

## 6. Stakeholder Communication Plan

- **Weekly Demo:** A standing meeting every Friday to demonstrate progress and gather feedback.
- **Async Updates:** A daily summary posted in the project's Slack channel.
- **Formal Review Gates:** Required sign-off from product and design leads at the end of Phases 1, 4, and 7.
- **Documentation:** All components and architectural decisions will be documented in a shared knowledge base (e.g., Storybook, Confluence).
