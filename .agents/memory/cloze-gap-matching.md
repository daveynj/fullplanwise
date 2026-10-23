---
name: Fill-in-the-blank gap matching
description: Why cloze gaps are tidied and marked leniently, the limits of that leniency, and how to check changes against real lessons.
---
- The AI often breaks the "[n:word] must be a word-bank word" rule. It puts a changed form in the gap ("[4:rescued]" with "rescue"), splits a phrasal verb ("[1:wake] up" with "wake up"), or leaves part of the word outside the brackets ("[2:emission]s" with "emissions"). This affected about 7% of lessons from August to October 2026. It sometimes returns "[1:___]" placeholders or unrelated words that no matching can rescue; for new lessons the lesson check requests the section again (see lesson-check.md).
- Leniency only applies to gaps whose answer is NOT in the word bank. A gap whose answer is a bank word accepts only that word. If two bank words fit equally well, nothing extra is accepted. This keeps well-formed lessons behaving exactly as before.
- Tidying (splitting an ending off a gap) must use the same best bank match as marking. Splitting by the longest prefix word turned "[1:wakes up]" into "[1:wake]s up" when the bank had both "wake" and "wake up", which rejected the correct "wake up".
- The same tidy step runs when a lesson is saved and again when it is shown, so it must be idempotent. Old rows are fixed at display time, never by editing the DB.

**Why:** Students were marked wrong for choosing the right word. The DB is shared with production, so stored lessons must not be rewritten.

**How to apply:** Before changing the matching rules, run them read-only over all stored lessons. Check that no well-formed lesson changes, that a second pass changes nothing, that each gap accepts at most one bank word, and that the word the original answer matched is still accepted after tidying.
