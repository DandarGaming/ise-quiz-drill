# Workflow and Labels

## Board

Work is tracked on the GitHub Project "Brightspace Quiz Simulator" as a
Scrumban board: a Kanban flow with a few Scrum pieces kept for planning.

| Column      | Meaning                                           |
| ----------- | ------------------------------------------------- |
| Backlog     | Captured, not planned yet                         |
| To do       | Planned for the current milestone, ready to start |
| In progress | Being worked on (keep this to one or two items)   |
| In review   | Pull request open, waiting for CI and approval    |
| Done        | Merged or closed                                  |

- New issues and pull requests are added to the board automatically. Merged
  pull requests and closed issues move to Done on their own.
- The milestone is the release goal (for example MVP v0.1). There are no
  sprints; work is pulled from To do when there is room in progress.
- Size (XS to XL) is set on the board for planning. It is not a label.
- A short retrospective closes each milestone.

## Labels

Labels are defined in [.github/labels.yml](../../.github/labels.yml) and
synced to GitHub by the Labels workflow, so changes go through a pull request.
Each issue and pull request gets:

- exactly one `type:` label, the same as its Conventional Commits prefix
- at least one `area:` label for the part of the product it touches
- exactly one `priority:` label
- `status: blocked` only while it waits on something outside the ticket

Colours follow the group: blue for type, green for area, red to pale green
for priority, grey for status.

## What is automatic

- Pull requests get their `type:` label from the branch name
  (`type/<issue>-slug`) and `area: infra` or `area: quiz-taking` from the
  changed paths ([.github/labeler.yml](../../.github/labeler.yml)).
- Dependabot pull requests get `dependencies`, a type, `area: infra` and
  `priority: low` from [.github/dependabot.yml](../../.github/dependabot.yml).
- `tests/labels.test.ts` fails if either file applies a label that
  labels.yml does not define.

Priority, product areas without code yet and labels on issues are set by hand.
