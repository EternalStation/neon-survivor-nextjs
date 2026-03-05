---
name: making-docs-for-void-nexus

description: Analyze existing code and create a knowledge base describing system functionality in Markdown files inside the docs directory. Use when the goal is to document the current behavior of the system to enable safe refactoring without losing functionality, as well as when requests involve full or incremental descriptions of modules, scenarios, rules, and dependencies.
---

# Making Docs For Void Nexus

## Goal

Collect and maintain documentation of the actual system behavior so that deep refactoring can be performed without functional regressions.

## Constraints

- Only create or modify `.md` files inside the `docs` directory.
- Do not modify code, configs, or any files outside `docs`.
- Write all documentation in Russian.
- Describe domain behavior and rules, not technical implementation details.
- Avoid referencing file names, frameworks, or internal project structure unless necessary to remove ambiguity.
- In every iteration, `docs/INDEX.md` must be updated.

## Workflow (Iterative, per module/function)

1. Accept a narrow focus for the current iteration:
- Work only with the function or module specified in the request.
- Do not attempt to document the entire project in a single pass.

2. Research the target behavior:
- Identify the actual behavior, preconditions, triggers, main flow, alternatives, and error cases.
- Separate confirmed facts from assumptions.

3. Update the corresponding file in `docs`:
- If the topic already exists, extend and refine the existing file.
- If the topic does not exist, create a new relevant file without duplicating existing sections.

4. Link to the existing knowledge base:
- Add links to related functions, entities, and scenarios described in other `docs` files.
- Add back-links in related documents when necessary for traceability.

5. Update `docs/INDEX.md`:
- Add the new file to the table of contents or adjust the description of an existing entry.
- Preserve the hierarchical tree structure of sections.
- Provide a clear and concise one-line description of each file’s purpose.

6. Finish the iteration with a quality check:
- Verify that the description is sufficient to preserve behavior during refactoring.
- Explicitly include `Assumptions` and `Open Questions` sections if information is incomplete.

## Document Linking Rules

- Use Markdown hyperlinks directly within the text.
- If a word or phrase refers to an entity/function already documented in another `docs` file, convert that word or phrase into a link to the corresponding file and section.
- Link only to files and anchors that actually exist.
- Use consistent entity names across all files and maintain a unified link format.
- When a new entity appears, add links to it from related documents in the next iteration.
- At the end of each document, keep a section called `Related Functions and Entities` containing key navigation links.

## INDEX.md (Required)

- Maintain `docs/INDEX.md` as the single table of contents for the entire knowledge base.
- Structure the table of contents as a hierarchical tree by sections/topics.
- For every file include:
  - a link to the file;
  - a short and unambiguous description of its purpose (one short line).
- Update `INDEX.md` in every iteration, even if only one document was modified.

## Hyperlink Format

- Use relative Markdown paths for links within `docs`:
- Prefer linking to a specific section, not just the file.
- If the section does not yet exist, temporarily link to the file without an anchor and mark this in `Open Questions`.

## Standard Structure for Describing Each Function

Use the following template for every functional block:
```md
## <Function Name>
### Purpose
Briefly: what problem it solves and for whom.
### Triggers
What initiates the behavior (user action, system event, state change).
### Preconditions
Conditions that must be satisfied before execution.
### Main Flow
Numbered sequence of steps from start to result.
### Alternatives and Errors
Edge cases, cancellations, invalid data, and failure behavior.
### Result and Side Effects
What changes after completion and which areas are affected.
### Related Functions
Links to other sections in docs that this behavior depends on.
```

## Quality Criteria

- Completeness: behavior of the module can be reconstructed without reading the code.
- Verifiability: the text can be used to derive regression test checklists.
- Consistency: the same entities are described using consistent terminology.
- Traceability: every important scenario links to related rules and states.
- Maintainability: future iterations should update existing documents instead of creating duplicates.

## Response Format When Executing the Skill

- Briefly list the files created or updated in `docs`.
- Specify which functional areas are now covered.
- Separately list open questions and assumptions, if any remain.
