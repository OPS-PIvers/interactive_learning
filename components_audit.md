# Components Audit

This file audits the components in `src/client/components`.

| Component Name/Path | Description | Usage Count | Usage Location |
|---|---|---|---|
| `src/client/components/App.tsx` | Main application component, root of the React tree. | 1 | `index.tsx` |
| `src/client/components/Icon.tsx` | Renders a predefined set of SVG icons. | 32 | `ViewerView.tsx`, `ProjectCard.tsx`, `ViewerFooterToolbar.tsx`, `SlideEditorToolbar.tsx`, `InteractionSettingsModal.tsx`, `QuizInteractionEditor.tsx`, `AuthButton.tsx`, `App.tsx`, `LoadingScreen.tsx`, `SlideTimeline.tsx` |
| `src/client/components/auth/AuthButton.tsx` | Button for user authentication, shows sign-in or user profile. | 3 | `SlideEditorToolbar.tsx`, `App.tsx` |
| `src/client/components/auth/AuthModal.tsx` | Modal for user sign-in, sign-up, and password reset. | 2 | `AuthButton.tsx`, `App.tsx` |
| `src/client/components/editors/ModernSlideEditor.tsx` | The main editor interface for a slide. | 1 | `EditorTestPage.tsx` |
| `src/client/components/editors/PanZoomSettings.tsx` | Component to configure pan and zoom settings. | 1 | `ModernSlideEditor.tsx` |
| `src/client/components/editors/SpotlightSettings.tsx` | Component to configure spotlight settings. | 1 | `ModernSlideEditor.tsx` |
| `src/client/components/interactions/InteractionEditor.tsx` | Editor for creating and modifying interactions. | 1 | `HotspotEditorModal.tsx` |
| `src/client/components/interactions/InteractionParameterPreview.tsx` | Shows a preview of interaction parameters. | 1 | `InteractionEditor.tsx` |
| `src/client/components/interactions/InteractionSettingsModal.tsx` | Modal for configuring interaction settings. | 1 | `HotspotEditorModal.tsx` |
| `src/client/components/interactions/editors/AudioInteractionEditor.tsx` | Editor for audio interactions. | 1 | `InteractionEditor.tsx` |
| `src/client/components/interactions/editors/QuizInteractionEditor.tsx` | Editor for quiz interactions. | 1 | `InteractionEditor.tsx` |
| `src/client/components/interactions/editors/TextInteractionEditor.tsx` | Editor for text interactions. | 1 | `InteractionEditor.tsx` |
| `src/client/components/interactions/editors/VideoInteractionEditor.tsx` | Editor for video interactions. | 1 | `InteractionEditor.tsx` |
| `src/client/components/modals/ShareModal.tsx` | Modal for sharing a project or module. | 2 | `ViewerFooterToolbar.tsx`, `SlideEditorToolbar.tsx` |
| `src/client/components/modals/editors/HotspotEditorModal.tsx` | Modal for editing hotspot properties and interactions. | 1 | `ElementRenderer.tsx` |
| `src/client/components/overlays/InteractionOverlay.tsx` | Overlay for displaying and interacting with elements. | 1 | `SlideBasedInteractiveModule.tsx` |
| `src/client/components/responsive/ResponsiveAspectRatioModal.tsx` | A modal that maintains its aspect ratio. | 1 | `SlideBasedInteractiveModule.tsx` |
| `src/client/components/responsive/ResponsiveBackgroundModal.tsx` | A modal for responsive backgrounds. | 1 | `ModernSlideEditor.tsx` |
| `src/client/components/responsive/ResponsiveModal.tsx` | A modal component that adapts to screen sizes. | 1 | `InteractionSettingsModal.tsx` |
| `src/client/components/shared/ErrorBoundary.tsx` | A component to catch JavaScript errors in their child component tree. | 2 | `App.tsx`, `HookErrorBoundary.tsx` |
| `src/client/components/shared/ErrorScreen.tsx` | A screen to display when a critical error occurs. | 1 | `ErrorBoundary.tsx` |
| `src/client/components/shared/HookErrorBoundary.tsx` | An error boundary specifically for React hooks. | 1 | `App.tsx` |
| `src/client/components/shared/LoadingScreen.tsx` | A screen to display while the application is loading. | 1 | `App.tsx` |
| `src/client/components/slides/SlideBasedDemo.tsx` | A demo component for slide-based presentations. | 1 | `SlideBasedTestPage.tsx` |
| `src/client/components/slides/SlideCanvas.tsx` | The canvas where slide elements are rendered. | 1 | `ModernSlideEditor.tsx` |
| `src/client/components/slides/SlideElement.tsx` | Renders a single element on a slide. | 1 | `ElementRenderer.tsx` |
| `src/client/components/slides/SlideTimeline.tsx` | Timeline component for navigating through slide events. | 1 | `ModernSlideEditor.tsx` |
| `src/client/components/slides/SlideViewer.tsx` | Component for viewing a slide deck. | 2 | `SharedModuleViewer.tsx`, `SlideBasedViewer.tsx` |
| `src/client/components/slides/TimelineSlideViewer.tsx` | A slide viewer that is synchronized with a timeline. | 1 | `SlideBasedDemo.tsx` |
| `src/client/components/slides/canvas/CanvasContainer.tsx` | Container for the slide canvas. | 1 | `SlideCanvas.tsx` |
| `src/client/components/slides/canvas/ElementRenderer.tsx` | Renders individual elements on the canvas. | 1 | `SlideRenderer.tsx` |
| `src/client/components/slides/canvas/ResponsiveCanvas.tsx` | A canvas that responds to container size changes. | 1 | `CanvasContainer.tsx` |
| `src/client/components/slides/canvas/SlideRenderer.tsx` | Renders the content of a single slide. | 1 | `ResponsiveCanvas.tsx` |
| `src/client/components/testing/EditorTestPage.tsx` | A test page for the slide editor. | 1 | `App.tsx` |
| `src/client/components/testing/SlideBasedTestPage.tsx` | A test page for slide-based components. | 1 | `App.tsx` |
| `src/client/components/toolbars/EditorFooterControls.tsx` | Footer controls for the slide editor. | 1 | `ModernSlideEditor.tsx` |
| `src/client/components/toolbars/SlideEditorToolbar.tsx` | Toolbar for the slide editor. | 1 | `ModernSlideEditor.tsx` |
| `src/client/components/toolbars/ViewerFooterToolbar.tsx` | Footer toolbar for the slide viewer. | 1 | `ViewerView.tsx` |
| `src/client/components/touch/TouchContainer.tsx` | A container for handling touch events. | 1 | `CanvasContainer.tsx` |
| `src/client/components/ui/FileUpload.tsx` | A component for file uploads. | 3 | `AudioInteractionEditor.tsx`, `VideoInteractionEditor.tsx`, `ModernSlideEditor.tsx` |
| `src/client/components/ui/GradientCreateButton.tsx` | A create button with a gradient style. | 1 | `App.tsx` |
| `src/client/components/ui/ProjectCard.tsx` | A card component to display project information. | 1 | `App.tsx` |
| `src/client/components/ui/TextBannerCheckbox.tsx` | A checkbox with a text banner. | 1 | `QuizInteractionEditor.tsx` |
| `src/client/components/ui/ToastNotification.tsx` | A component to display toast notifications. | 1 | `App.tsx` |
| `src/client/components/views/InteractiveModuleWrapper.tsx` | A wrapper for interactive modules. | 1 | `SharedModuleViewer.tsx` |
| `src/client/components/views/ScrollStacks.tsx` | A view for scrollable stacks of content. | 1 | `App.tsx` |
| `src/client/components/views/SharedModuleViewer.tsx` | A viewer for shared interactive modules. | 1 | `App.tsx` |
| `src/client/components/views/SlideBasedInteractiveModule.tsx` | An interactive module based on slides. | 1 | `InteractiveModuleWrapper.tsx` |
| `src/client/components/views/SlideBasedViewer.tsx` | A viewer for slide-based content. | 1 | `SlideBasedInteractiveModule.tsx` |
| `src/client/components/views/ViewerView.tsx` | The main view for the viewer application. | 1 | `SlideBasedViewer.tsx` |
