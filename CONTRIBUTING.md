# Contributing Guidelines

Thank you for considering a contribution! To maintain a clean and manageable codebase, please follow these guidelines.

## Technical Standards

### General Rules
* **Clarify First:** Do not hesitate to ask questions and clarify requirements before you start implementing changes.
* **Atomic Commits:** Keep commits focused on a single purpose. If a change covers multiple unrelated areas, split it into separate commits.
* **Conciseness:** Aim for a clean commit history by keeping the number of commits meaningful and minimal.
* **GitHub Actions & Testing:** If you need to test CI/CD workflows with "temporary" commits, please **rebase or squash** them once the implementation is successful to keep the history clean.
* **Readability:** The `git log` history should remain readable, simple, and consistent.

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. 

**Structure:**
`<type>: <description>`

**Commonly Used Types:**
* `add`: Introducing new features or files.
* `upd`: Updating existing logic or documentation.
* `del`: Removing code or files.
* `ren`: Renaming files or refactoring structures.
* `fix`: Bug fixes.
* `tmp`: Temporary changes (should be refactored/squashed before merging).

**Description Requirements:**
* Keep it short and meaningful.
* Ensure it describes exactly *what* changed.
* Limit the description to a single line for better visibility in git logs.
