# Public lesson discovery analytics

Uses Replit's optional injected Umami tracker, separate from the existing GA4
events. No new script, website ID, environment variable or database write is
needed. A missing, blocked, throwing or rejected tracker never stops browsing.

| Event | When |
| --- | --- |
| `public_library_tag_selected` | A visitor changes to a reviewed topic tag. |
| `public_library_category_selected` | A visitor changes to a curated topic area. |
| `public_library_zero_results` | A deliberate filter action has no matches, or a search has no matches after 500ms without typing. |
| `public_library_filters_reset` | A visitor clears search, selects All tags/All topics, or resets all filters. |
| `public_library_lesson_opened` | A visitor activates a lesson card link in the public browser. |

Payloads contain only `tag` and `category` (allowlisted keys), `cefr_level`
(A1–C2), `result_count` and, for opens, `lesson_id`. All/unknown values are
omitted. No search text, titles, requests, student information or lesson content
is passed to custom analytics.

Selection counts describe the new filter result. Reset context identifies the
filters being cleared, with the count after clearing. Opens include the active
tag/category, visible count and the opened lesson's current CEFR level.

Initial loads and background refreshes produce no custom events. Re-selecting
the active filter is a no-op. A new deliberate zero-result action can produce
another event even if its safe payload is identical. Unfinished searches are
cancelled on another filter action or leaving the page. These are interaction
counts, not unique visitor counts, and card opens measure intent, not a lesson
successfully loading or being taught.

Analytics must be enabled in Publishing settings for the injected tracker to
collect events in the published app. This change does not enable analytics or
publish the app.
