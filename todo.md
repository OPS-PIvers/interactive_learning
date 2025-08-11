Todos:

ISSUE #1: 
Prevoiusly, wiht the properites panel when it had hotspot info, I could edit the parameters of hte interaction.  Now that functionality doesn't exist.  When The Hotspot edito rmodal pops up, I click interactions and I can create an interaction event, but the edit icon on that interaction only allows me the change the title of the hotspot, and the settings cog icon is non-functional.  When I click the edit icon, I should be able to edit all the parameters of the interaction(s), like the duration, how it's activated, etc.

  ☐ Fix interaction parameter editing functionality in hotspot modal      

ISSUE #2:
As I expand from medium to large screen, the editor toolbar  disappears entirely as I pass the breakpoint to the large screen.  
  ☑ Fix toolbar disappearing on large screens

ISSUE #3
When i click a hotspot, the hotspot editor modal appears.  Then, when I click the interactions tab and choose "add interaction", the background dims, but no interaction options show up. I imagine there is a modal opening underneath the hotspot editor modal.
  ✅ Fix InteractionTypeSelector so it appears as a submenu within the hotspot editor modal, not as a modal outside of it.

ISSUE #4 (CONTINUATION OF ISSUE #3)

  ✅ Move all submenus to appear within their corresponding modal, not as separate modals as this causes layering issues.
  **FIX**: Refactored `InteractionTypeSelector.tsx` to create an embeddable `InteractionTypeSelectorGrid` component. This was then integrated into the `HotspotEditorModal.tsx`'s "Interactions" tab, replacing the problematic modal-on-modal implementation. This ensures the interaction selection UI appears within the main modal, resolving the layering issue systemically. The old modal component in `InteractionTypeSelector.tsx` is left unused for now to prevent breaking other potential usages.
