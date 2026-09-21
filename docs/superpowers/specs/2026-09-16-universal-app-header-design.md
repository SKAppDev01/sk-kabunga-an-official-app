# Universal App Header Design

Date: 2026-09-16
Project: SK Kabunga-an Official App
Status: Approved design, pending implementation plan

## 1. Goal

Replace the app's duplicated post-login header implementations with one reusable `AppHeader` component so every tab screen and operational subscreen has the same size, position, blue color, rounded bottom corners, shadow, centered title, safe-area/status-bar treatment, and back/action placement.

The change is intentionally limited to post-login application screens. Authentication and first-time setup screens keep their current purpose-built layouts.

## 2. Current Problem

The current source has several overlapping header systems:

- `RoundedTabHeader` is used by the five main tabs and a small number of subscreens.
- Many subscreens define local `header`, `headerTitle`, `headerSpacer`, and related styles.
- Many screens use `stickyHeaderIndices` to keep a locally rendered header in place.
- `_layout.tsx` separately draws a `TopHeaderBackdrop` and a global `FloatingBackButton`.
- Some screens render their header conditionally, which can make the title disappear in loading or empty states.

This duplication has already produced visible inconsistencies in header height, top spacing, title centering, scroll behavior, back-button placement, and status-bar coverage.

## 3. Scope

### Included

- Main tabs: Home, Projects, Finance, Records, More.
- All operational post-login subscreens, including records, youth, activities, meetings, projects, finance, documents, inventory, settings, reports, data management, backup/restore/import/export, QR/data-sharing, details, add/edit forms, and similar authenticated screens.
- Existing header-side information and controls such as record counts, refresh buttons, save/action buttons, and badges.
- Android immersive-mode compatibility already present in `_layout.tsx`.

### Excluded

The following screens keep their current special layouts and do not use `AppHeader`:

- Login
- Register
- Recovery
- Profile Setup
- Founding Official Setup
- Official Verification
- The route bootstrap/index screen when it is only redirecting or deciding navigation

## 4. Component Architecture

Create one component:

`src/components/AppHeader.tsx`

Proposed public API:

```tsx
type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
  accessibilityLabel?: string;
};
```

Usage examples:

```tsx
<AppHeader title="Home" />
```

```tsx
<AppHeader title="Budget Categories" showBack />
```

```tsx
<AppHeader
  title="Security & Audit"
  showBack
  right={<RefreshButton onPress={refresh} />}
/>
```

Behavior rules:

- `showBack` renders the standard app Back control.
- `onBackPress` defaults to `router.back()` when `showBack` is true.
- `left` is available only for exceptional authenticated screens that need a custom leading control.
- `right` hosts existing counts, badges, refresh, save, or other compact header actions.
- `left` and `showBack` are mutually exclusive in normal use.

## 5. Visual Standard

`AppHeader` becomes the single source of truth for header visuals.

Required appearance:

- Background: existing app/website primary blue from the theme (`colors.primary`).
- Width: full screen width.
- Header body minimum height: same compact height currently established by the Home tab header.
- Top/status-safe-area background: continuous blue with no exposed wallpaper or page background above the header.
- Bottom-left radius: 28.
- Bottom-right radius: 28.
- Top corners: square so the header is flush to the top edge.
- Title: white, bold, using the same typography and size as the current Home tab header.
- Shadow/elevation: one shared definition matching the Home header.
- Header remains fixed while page content scrolls.

The component will own all header spacing. Individual screens must not add negative top margins, status-bar fillers, header-specific safe-area padding, or blue backdrop views.

## 6. True Centering Layout

The title must remain mathematically centered on the physical screen, regardless of whether a Back button or right-side action exists.

Use a three-zone layout:

- Left zone: fixed width.
- Center title zone: absolute/full-width centered title layer or equivalent balanced layout.
- Right zone: same fixed width as the left zone.

Rules:

- Back icon is placed inside the left zone.
- A right action is placed inside the right zone.
- If no right action exists, the right zone remains reserved/invisible.
- Long titles use one line with controlled truncation rather than shifting off center.
- Header actions must not overlap the centered title.

## 7. Safe Area and Status Bar

The universal header owns the top safe area.

Screen structure will use `SafeAreaView` with left/right/bottom edges only, or an equivalent root container that does not add top padding outside the header.

`AppHeader` will read `useSafeAreaInsets()` and extend its blue background through `insets.top`. This keeps the header visually connected to the top edge when system UI is temporarily revealed.

The existing global `TopHeaderBackdrop` becomes unnecessary and will be removed from `_layout.tsx` after migration.

The existing hidden `StatusBar` and Android navigation-bar immersive behavior remain unchanged unless a verification test proves an adjustment is necessary.

## 8. Back Navigation

Back navigation becomes part of `AppHeader` instead of a global overlay.

- Root tabs do not show Back.
- Operational subscreens show Back by default when migrated.
- Existing custom Back behavior is preserved through `onBackPress` when a screen must do more than `router.back()`.
- `_layout.tsx` will remove `FloatingBackButton` and the route allowlist associated with it.
- Back controls remain accessible with a minimum touch target of approximately 44x44 points.

This prevents a floating control from colliding with header content or appearing on the wrong route.

## 9. Scrolling and Screen Structure

Every migrated post-login screen follows this structure:

```tsx
<View style={styles.screen}>
  <AppHeader title="..." showBack />

  <ScrollView contentContainerStyle={styles.content}>
    {/* screen-specific content */}
  </ScrollView>
</View>
```

or, for list screens:

```tsx
<View style={styles.screen}>
  <AppHeader title="..." showBack />

  <FlatList
    data={...}
    contentContainerStyle={styles.content}
    ...
  />
</View>
```

Rules:

- `AppHeader` is never placed inside the scrollable content.
- Header-related `stickyHeaderIndices` are removed.
- Loading, empty, error, restricted-access, and populated states all render under the same persistent header.
- Existing scrolling behavior below the header is preserved.
- Bottom content padding remains sufficient to clear the fixed tab navigation where applicable.

## 10. Main Tab Integration

The five main tab screens will replace `RoundedTabHeader` with `AppHeader`.

The old `RoundedTabHeader` component will be removed only after no active screen imports it.

No Back button is shown on tabs.

The existing bottom tab navigation remains unchanged by this header migration.

## 11. Subscreen Migration

Each authenticated subscreen will be migrated from local header markup to `AppHeader`.

For each screen:

1. Identify the existing title.
2. Preserve Back behavior.
3. Preserve any right-side count/action using `right`.
4. Move `AppHeader` outside `ScrollView`/`FlatList`.
5. Remove header-only `stickyHeaderIndices`.
6. Delete obsolete local header styles only when no longer used elsewhere in that file.
7. Preserve all business logic, database calls, forms, filters, dialogs, empty states, and navigation targets.

This is a visual/structural refactor, not a feature rewrite.

## 12. Special Header Content

Some screens currently expose information inside the header. These are retained via the `right` slot.

Examples:

- Record counts: compact badge/count in `right`.
- Refresh: icon button in `right`.
- Save or submit: only if it is already a header action and remains compact enough for the right zone.

Large controls, filter rows, descriptions, tabs, or multi-line content must remain in the scrollable page body rather than being moved into the universal header.

## 13. Theme and Dark Mode

The header uses shared theme tokens rather than hard-coded duplicated values.

For the current blue design, `colors.primary` remains the header background in both themes unless the existing theme system explicitly defines a separate dark-mode primary token.

Any future change to height, blue shade, radius, title font, shadow, or header action treatment should require editing `AppHeader` or shared theme tokens only.

## 14. Error and Edge-State Behavior

`AppHeader` must render independently from screen data state.

Therefore:

- Network/database errors do not remove the header.
- Empty lists do not remove the header.
- Restricted-access states do not remove the header.
- Loading states do not remove the header.
- A right-side action may be disabled or omitted when its backing data is unavailable, but the header geometry remains stable.

## 15. Migration Safety

Because this touches many screens, migration will be incremental and mechanically verifiable.

Implementation should avoid changing unrelated business logic. The safest order is:

1. Add and test `AppHeader`.
2. Migrate the five tabs.
3. Migrate a small representative set of subscreens with different patterns.
4. Verify the shared patterns.
5. Migrate the remaining operational screens.
6. Remove old global header/backdrop helpers.
7. Remove `RoundedTabHeader` after confirming zero imports.
8. Run whole-source checks.

## 16. Verification Requirements

Before declaring the migration complete:

### Static/source checks

- All TS/TSX files parse successfully.
- No post-login screen imports `RoundedTabHeader`.
- No post-login screen retains the old custom header markup pattern when it should use `AppHeader`.
- No header-related `stickyHeaderIndices` remain.
- `_layout.tsx` no longer contains `TopHeaderBackdrop` or `FloatingBackButton`.
- Authentication/setup exclusions do not import `AppHeader`.

### Behavioral checks

Manually verify at least:

- Home: header identical in appearance to the approved Home reference.
- Projects: fixed header and correct scroll behavior.
- Records -> Youth Registry: centered title and Back placement.
- Upcoming Events: no blue strip/gap; header stays fixed.
- All Activity / Activities empty state: header remains visible.
- Security & Audit: right-side Refresh does not move title off center.
- A form screen such as Add Youth: Back works and content scrolls below header.
- A detail screen such as Project Details: Back works and header remains fixed.
- Android immersive mode: temporary system-bar reveal does not expose a mismatched background above the header.
- Bottom tab navigation remains usable and visually unchanged.

### Regression checks

- No database/schema changes.
- No authentication/authorization behavior changes.
- No changes to tab destinations or route names.
- No new native dependency and therefore no new Dev Build requirement for this refactor.

## 17. Completion Criteria

The universal header migration is complete when:

- Every intended post-login screen uses `AppHeader`.
- Excluded authentication/setup screens remain unchanged.
- All headers have one consistent visual implementation.
- Header title position is stable across left/right action combinations.
- Header remains fixed while content scrolls.
- Status/safe-area coverage is seamless.
- Old duplicated header infrastructure is removed.
- Verification checks pass and representative screens are visually confirmed on-device.
