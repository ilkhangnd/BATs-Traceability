# BATS ZaUI Uni UI/UX Polish Audit

Target Figma file: https://www.figma.com/design/jyisKfjxdw3k7n80qyzzh1

Status: Figma MCP is currently blocked by the Starter plan tool-call limit for `Khang Nguyễn Đình's team`, so the live file cannot be updated until the quota resets or the plan is upgraded.

## Main Issues In Current Figma

1. Icon quality is too rough

   Current screens use text placeholders such as `GRID`, `SPRT`, `LAYR`, `LOT`, `Q`, `QR`. This makes the UI feel like a wireframe. Replace with real vector icons matching the app code: `LayoutGrid`, `Sprout`, `Layers`, `History`, `User`, `MapPin`, `Wifi`, `ShieldCheck`, `Camera`, `Send`, `QrCode`.

2. Visual hierarchy is not strong enough

   The Home hero, shortcut grid, and guide cards have similar density and visual weight. The Home screen should feel more like a ZaUI Uni landing screen: strong branded hero, compact metrics row, quick actions, then content cards.

3. Cards are too uniformly styled

   Many cards use the same border, radius, and shadow. Use three card roles instead:
   - `Hero/Primary`: stronger color surface.
   - `Action`: white surface, light shadow, clear icon tile.
   - `Data`: denser, low-shadow, strong metadata labels.

4. Mobile rhythm needs tightening

   Several text blocks sit close to card edges or wrap awkwardly. Use a consistent 16px page margin, 12px card internal gaps, 44-48px touch targets, and 64px fixed bottom navigation.

5. State design needs clearer semantics

   Offline/online, geofence-valid, queue-pending, anchored, and warning states should have distinct but restrained tokens. Current state colors work, but the presentation feels generic.

6. Design system board is useful but not beautiful

   Keep the handoff board, but make it secondary. The first canvas row should be polished product screens, with the design system below.

## Recommended V2 Direction

- Keep `Plus Jakarta Sans`; it matches the app source.
- Use Zalo blue `#0068FF` as the shell/navigation color, but do not let it dominate every card.
- Use agricultural green `#16A34A` for successful harvest/geofence moments.
- Use amber `#D97706` only for pending/offline states.
- Replace placeholder icon text with imported SVG/vector icons.
- Add compact data chips on Home:
  - `3 lô chờ`
  - `6 vùng trồng`
  - `GPS sẵn sàng`
- Make the Harvest screen the strongest workflow screen:
  - Farmer banner
  - Form grouped into plot, quantity, location, evidence
  - Sticky bottom CTA style inside content
- Make Queue look operational:
  - Offline/online banner
  - Sync CTA
  - Queue items with retry count, idempotency key, and status chip
- Make History more trust-oriented:
  - Batch status chip
  - GS1 Digital Link action
  - Blockchain anchored proof hint

## Live Update Plan Once Figma Quota Is Available

1. Archive current screens into a `v1 wireframe` section.
2. Create a new `v2 polished` section at the top of the canvas.
3. Rebuild the five screens with real SVG icons and cleaner spacing.
4. Update local component specimens:
   - Top app bar
   - Bottom navigation
   - Icon shortcut
   - Form field
   - State banner
   - Batch card
   - Primary CTA
5. Run screenshot validation for Home, Harvest, Queue, and History.

