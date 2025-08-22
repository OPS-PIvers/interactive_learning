# Components Audit

This file audits the components in `src/client/components`.

| Component Path/Name | Used? | Equivalent Components | Equivalent(s) Used? | Recommendation |
| --- | --- | --- | --- | --- |
| `src/client/components/auth/AuthButton.tsx` | Yes | None | N/A | Keep |
| `src/client/components/auth/AuthModal.tsx` | Yes | None | N/A | Keep |
| `src/client/components/icons/GearIcon.tsx` | Yes | `SettingsIcon.tsx` | Yes | Consolidate |
| `src/client/components/icons/SettingsIcon.tsx` | Yes | `GearIcon.tsx` | Yes | Consolidate |
| `src/client/components/ui/FileUpload.tsx` | Yes | `SecureFileUpload.tsx` | No | Consolidate |
| `src/client/components/ui/SecureFileUpload.tsx` | No | `FileUpload.tsx` | Yes | Consolidate |
