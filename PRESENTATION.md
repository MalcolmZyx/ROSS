# CaseLight — hackathon presentation

An attorney-focused presentation and demo talk track for the implemented CaseLight prototype. The slide text is intentionally short; use the narration as speaker notes alongside the demo video.

## Suggested run of show

- **Opening and problem:** 60–90 seconds
- **Demo video with narration:** 2–3 minutes
- **Close:** 20–30 seconds

## Slide 1 — A case file should not take an hour to understand

**On the slide**

> CaseLight  
> A two-minute case brief for attorneys—and a carefully limited window for providers.

**Say**

“A personal-injury case can have hundreds of notes, emails, tasks, and pages of medical records. The important information is in there, but finding it takes time—and sharing the right part with a treating provider is its own challenge. CaseLight turns that file into a concise, source-linked case view, then lets the attorney share a tailored view with the provider.”

## Slide 2 — The problem statements we chose to address

**On the slide**

- **Get oriented:** “Get me up to speed … without having to ask anyone.”
- **Find what matters:** “Out of three hundred entries, show me the ten that matter.”
- **Trust the answer:** “If a date is on screen, I need to see where it came from.”
- **Coordinate the work:** “What’s overdue, what’s coming, and what’s waiting?”
- **Share selectively:** “Let me adjust what the provider sees before I send it.”
- **Keep providers informed:** “Is this case even still alive?”

**Say**

“We focused on the overlap between attorney and provider needs: faster case orientation, less manual searching, evidence behind the summary, a clearer view of next actions, and a way to keep providers informed without handing them the whole legal file. We did not try to build every item on the hackathon’s menu.”

## Slide 3 — One matter, made navigable

**On the slide**

- Connect to Clio and choose a client/matter
- Pull the matter into a case snapshot
- See the client, case stage, recent contact, and important numbers
- Read a one-minute brief, then dig into the full file

**Say**

“The attorney starts by connecting to Clio and selecting a client. CaseLight gathers the matter’s notes, emails, calls, tasks, calendar events, expenses, and documents. On the case screen, the attorney can get oriented quickly, then move from the overview into the source material instead of losing the trail. The integration reads from Clio; it does not write changes back.”

## Slide 4 — From hundreds of entries to the next useful fact

**On the slide**

- Prioritized highlights and “new since you looked”
- Case value, insurance coverage, medical specials, liens, and firm spend
- Estimated client net, with deductions visible
- Overdue, upcoming, and waiting work
- Injuries linked to scanned-record pages

**Say**

“The brief is not just a chat response. We calculate financial and workflow facts from the Clio fields and entries, then use AI where judgment is useful: prioritizing what matters and summarizing the story. The attorney can see what changed since the last visit, what needs attention, and where injuries appear in the medical records. In the demo matter, that means organizing 162 entries and making 522 scanned pages searchable and citable.”

“The ‘client nets’ number is an **estimate**, not a promise of recovery. It models the case value subject to the insurance cap, then subtracts an assumed contingency fee, firm costs, and recorded liens. The fee assumption is labelled in the interface.”

## Slide 5 — Every important answer has a way back

**On the slide**

- Click a figure, date, or brief citation to open its source
- Open document pages and the original Clio record
- Ask a question across notes, messages, tasks, and OCR text
- If the file does not support an answer, say so

**Say**

“A summary is only useful if the lawyer can verify it. CaseLight links facts and AI-generated brief sentences back to their notes, emails, tasks, or document pages. The Ask feature searches the synced file and returns cited passages; when the records do not answer the question, it can say ‘Not in the file’ instead of filling the gap with a guess. You can also open the underlying document or jump to its Clio source.”

## Slide 6 — Demo video: follow the attorney’s path

**On the slide**

> Clio → client → case snapshot → evidence → next actions → Ask → provider preview

**Say over the video, in order**

1. **Connect and choose:** “We connect to Clio, then select the client and matter we want to review.”
2. **Orient:** “The matter opens with basic client and case context, including stage and recent contact.”
3. **Check the economics:** “These are the key numbers: estimated case value and insurance coverage, plus the client-net estimate. ‘Client nets’ means the modeled amount left after the fee assumption, firm costs, and lien—not a guaranteed payout.”
4. **Locate the injuries:** “The body map points to injuries found in the records. Selecting one takes us to the relevant source pages, including OCR text from scanned documents.”
5. **Review the timeline:** “Key moments show how the case got here and what is scheduled next. We can jump to today, open a source, or go directly to the document in Clio.”
6. **Read the brief:** “The one-minute case summary is generated from this matter’s data. Its citations let us inspect what supports each statement.”
7. **Act and catch up:** “Here are outstanding attorney tasks, and here is what changed since the last time this matter was opened. A refresh can bring in newer Clio data.”
8. **Ask the file:** “We can ask a case-specific question. CaseLight searches the matter and links the answer to relevant records; it is not a general legal-advice chatbot.”
9. **Choose what to share:** “Before sending a provider link, the attorney selects the provider, adjusts the sections, and checks a live preview. Insurance is off by default because it is sensitive. Internal notes, case value, settlement discussion, and liens are not shared.”
10. **Switch perspective:** “The provider view focuses on the case status, relevant summary, that provider’s billing and visits, and what the firm needs. It is a limited view of this matter—not the attorney’s complete file.”

## Slide 7 — Built for usefulness and restraint

**On the slide**

- Read-only Clio integration
- Deterministic case facts; AI for triage and narrative
- Source links throughout
- Provider data assembled from an explicit allow-list
- Share links can be revoked; opens are logged

**Say**

“Two design choices matter. First, we separate calculations from generated text: the numbers come from case data, while AI helps prioritize and explain. Second, sharing is limited by design. The attorney can preview and tailor a provider’s view; sensitive internal information is excluded rather than merely hidden on the page. Links expire, can be revoked, and their opens are visible to the firm.”

## Slide 8 — What this prototype demonstrates

**On the slide**

> Less time reconstructing the case.  
> More time deciding what to do next.  
> Better coordination without over-sharing.

**Say**

“CaseLight addresses a practical workflow gap: it makes a large case file easier to catch up on, makes its summaries verifiable, and gives providers a more useful view without exposing the entire file. The point is not to replace attorney judgment. It is to make the important context easier to find, check, and share.”

## Accuracy notes for presenting

- The AI integration in this repository is **Anthropic Claude**, not OpenAI. If you mention the model, say Claude; if you do not need to name the vendor, say “AI-generated.”
- “Client nets” means an estimated net recovery after modeled deductions. The contingency-fee percentage is an assumption, and the result is not a settlement prediction.
- Insurance is off by default in the share flow as a deliberate sensitivity control; the attorney can choose to include it.
- The doctor view is curated for a provider on the selected matter. Do not imply that providers can browse other client accounts or see the full legal file.
- The provider portal has an opt-in “Tell me when the case moves” control, but do not promise automated notifications in this demo. The “Reply to the firm” path is an email handoff, not an in-app messaging thread.
- The repository documents the demo dataset as a local Clio replica by default, with live Clio available when configured. Describe the video as a Clio-connected workflow, but do not claim the demo is reading a live account unless that is what you actually recorded.
