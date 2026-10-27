---
name: Lesson share image access
description: Why social-preview images must be authorized through the shared lesson, not just their storage-key scope.
---

Authorize a social-preview image through the lesson being shared. Do not assume its stored image key carries that lesson's numeric ID.

**Why:** Images can be generated before the lesson is saved, leaving an `unassigned` scope. Copied lessons can also reuse images from their source lesson, and older lessons may still contain inline Base64. Linking directly to a storage-key image can therefore fail for a logged-out preview crawler even when the shared lesson itself is viewable.

**How to apply:** Preserve a lesson-authorized preview endpoint that supports stored and inline images, rejects private/unshared lessons, and never fetches arbitrary external URLs supplied in content.
