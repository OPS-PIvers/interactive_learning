# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]: "[plugin:vite:import-analysis]"
    - generic [ref=e7]: Failed to resolve import "../utils/zIndexLevels" from "src/client/components/testing/EditorTestPage.tsx". Does the file exist?
  - generic [ref=e9] [cursor=pointer]: /app/src/client/components/testing/EditorTestPage.tsx:5:24
  - generic [ref=e10]: "18 | import React, { useState, useCallback } from \"react\"; 19 | import { createTestDemoSlideDeck } from \"../../../shared/testDemoSlideDeck\"; 20 | import { Z_INDEX } from \"../utils/zIndexLevels\"; | ^ 21 | import ModernSlideEditor from \"./editors/ModernSlideEditor\"; 22 | import { SlideViewer } from \"./slides/SlideViewer\";"
  - generic [ref=e11]:
    - text: "at TransformPluginContext._formatError (file:"
    - generic [ref=e12] [cursor=pointer]: ///app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:49258:41
    - text: ") at TransformPluginContext.error (file:"
    - generic [ref=e13] [cursor=pointer]: ///app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:49253:16
    - text: ") at normalizeUrl (file:"
    - generic [ref=e14] [cursor=pointer]: ///app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:64291:23
    - text: ) at process.processTicksAndRejections (node:internal
    - generic [ref=e15] [cursor=pointer]: /process/task_queues:105:5
    - text: ") at async file:"
    - generic [ref=e16] [cursor=pointer]: ///app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:64423:39
    - text: "at async Promise.all (index 5) at async TransformPluginContext.transform (file:"
    - generic [ref=e17] [cursor=pointer]: ///app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:64350:7
    - text: ") at async PluginContainer.transform (file:"
    - generic [ref=e18] [cursor=pointer]: ///app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:49099:18
    - text: ") at async loadAndTransform (file:"
    - generic [ref=e19] [cursor=pointer]: ///app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:51977:27
    - text: ") at async viteTransformMiddleware (file:"
    - generic [ref=e20] [cursor=pointer]: ///app/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:62105:24
  - generic [ref=e21]:
    - text: Click outside, press
    - generic [ref=e22]: Esc
    - text: key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e23]: server.hmr.overlay
    - text: to
    - code [ref=e24]: "false"
    - text: in
    - code [ref=e25]: vite.config.ts
    - text: .
```