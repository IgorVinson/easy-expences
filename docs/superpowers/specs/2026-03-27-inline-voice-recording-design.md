---
name: Inline Voice Recording in Modals
description: Move voice recording out of standalone RecordingModal and embed it into AddExpenseModal, AddEditGoalModal, and AddEditCategoryModal
type: project
---

# Inline Voice Recording in Modals

## Summary

Remove the standalone `RecordingModal` component and embed its recording UI directly into three modals: `AddExpenseModal`, `AddEditGoalModal`, and `AddEditCategoryModal`. Each modal gains a "Record" button in its footer (above Save) that switches the modal into a recording view, then auto-fills fields on completion.

## Shared Utility

Create `utils/voiceMatch.ts` extracting `findBestCategoryMatch` (currently in `RecordingModal`) for reuse across modals.

## Per-Modal Changes

### AddExpenseModal

**New state:** `voiceStep: 'form' | 'recording'`, plus animation state (pulse, animationSession) from RecordingModal.

**`voiceStep === 'form'`** (default):
- Normal form renders unchanged
- Footer: `[Record button]` above `[Save button]`
- Record button: outlined secondary style (same as "Back to recording" button in current RecordingModal review step)

**`voiceStep === 'recording'`**:
- Scroll content replaced by the recording view from RecordingModal verbatim: instruction text, `ListeningIndicator`, animated pulse mic button (112×112), error card
- Footer: hint text line from RecordingModal (no Save button)
- Tapping mic starts recording; tapping again (stop) processes audio

**Field mapping on result `{ title, amount, category }`:**
- Expense tab: `title → title`, `amount → amount`, fuzzy-match `category` against `categories` prop → `selectedCategory`
- Income tab: `title → title`, `amount → amount`, fuzzy-match `category` against `goals` prop names → `selectedGoal`

**Voice hint strings (`stopRecordingAndProcess(hints)`):**
- Expense tab: `categories.map(c => c.name)`
- Income tab: `goals.map(g => g.name)`

After processing: `voiceStep` resets to `'form'`, fields pre-filled, user edits freely before saving.

### AddEditGoalModal

Same `voiceStep` state and recording view pattern.

**Field mapping:**
- `title → name`, `amount → targetAmount` (category ignored)

**Voice hints:** `[]`

### AddEditCategoryModal

Same `voiceStep` state and recording view pattern.

**Field mapping:**
- `title → name`, `amount → budget` (category ignored)

**Voice hints:** `[]`

## Deletion

`RecordingModal` component is deleted. All callers (check `overview.tsx` and any other screens) remove their `RecordingModal` usage and the associated state (`recordingModalVisible`, etc.).

## File Changes

| File | Change |
|---|---|
| `utils/voiceMatch.ts` | New — extracts `findBestCategoryMatch` |
| `components/AddExpenseModal.tsx` | Add voice recording step |
| `components/AddEditGoalModal.tsx` | Add voice recording step |
| `components/AddEditCategoryModal.tsx` | Add voice recording step |
| `components/RecordingModal.tsx` | Delete |
| `app/(tabs)/overview.tsx` | Remove RecordingModal usage |
