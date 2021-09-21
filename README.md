<h1 align="center">Obsidian Tasks</h1>

<p align="center">Task management for the <a href="https://obsidian.md/">Obsidian</a> knowledge base.</p>

Track tasks across your entire vault. Query them and mark them as done wherever you want. Supports due dates, recurring tasks (repetition), done dates, sub-set of checklist items, and filtering.

*You can toggle the task status in any view or query and it will update the source file.*

> Please submit bugs here: https://github.com/schemar/obsidian-tasks/issues
>
> Please submit ideas here: https://github.com/schemar/obsidian-tasks/discussions/categories/ideas
>
> Please ask for help here: https://github.com/schemar/obsidian-tasks/discussions/categories/q-a

---

<ul>
    <li><a href="https://github.com/schemar/obsidian-tasks#installation">Installation</a></li>
    <li><a href="https://github.com/schemar/obsidian-tasks#usage">Usage</a></li>
    <li><a href="https://github.com/schemar/obsidian-tasks#filtering-checklist-items">Filtering</a></li>
    <li><a href="https://github.com/schemar/obsidian-tasks#due-dates">Due Dates</a></li>
    <li><a href="https://github.com/schemar/obsidian-tasks#recurring-tasks-repetition">Recurrence</a></li>
    <li><a href="https://github.com/schemar/obsidian-tasks#querying-and-listing-tasks">Querying</a></li>
</ul>

For changes in each release, please check the releases page: https://github.com/schemar/obsidian-tasks/releases

---

## Screenshots

- *All screenshots assume the [global filter](#filtering-checklist-items) `#task` which is not set by default (see also [installation](#installation)).*
- *The theme is [Obsidian Atom](https://github.com/kognise/obsidian-atom).*

![ACME Tasks](https://github.com/schemar/obsidian-tasks/raw/main/resources/screenshots/acme.png)
The `ACME` note has some tasks.

![Important Project Tasks](https://github.com/schemar/obsidian-tasks/raw/main/resources/screenshots/important_project.png)
The `Important Project` note also has some tasks.

![Tasks Queries](https://github.com/schemar/obsidian-tasks/raw/main/resources/screenshots/tasks_queries.png)
The `Tasks` note gathers all tasks from the vault and displays them using queries.

![Create or Edit Modal](https://github.com/schemar/obsidian-tasks/raw/main/resources/screenshots/modal.png)
The `Tasks: Create or edit` command helps you when editing a task.

## Installation
Follow the steps below to install Tasks.

1. Search for "Tasks" in Obsidian's community plugins browser
2. Enable the plugin in your Obsidian settings (find "Tasks" under "Community plugins").
3. Check the settings. It makes sense to set the global filter early on (if you want one).
4. Replace the "Toggle checklist status" hotkey with "Tasks: Toggle Done".
    - I recommend you remove the original toggle hotkey and set the "Tasks" toggle to `Ctrl + Enter` (or `Cmd + Enter` on a mac).

## Usage

Tasks tracks your checklist items from your vault.
The simplest way to create a new task is to create a new checklist item.
The markdown syntax for checklist items is a list item that starts with spaced brackets: `- [ ] take out the trash`.
Now Tasks tracks that you need to take out the trash!

**⚠️ Whenever Tasks behaves in an unexpected way, please try restarting obsidian.**

**⚠️ Tasks only supports single-line checklist items.**
You cannot have checklist items that span across multiple lines.

This works:

```markdown
- [ ] This is a task
    - This is a sub-item
    - Another sub-item
    - [ ] And a sub task
        - Even more details
```

The following *does not work:*

```markdown
- [ ] This task starts on this line
      and then its description continues on the next line
```

**⚠️ Tasks only supports checklist items in markdown files with the file extension `.md`**

A more convenient way to create a task is by using the `Tasks: Create or edit` command from the command palette.
You can also bind a hotkey to the command.
The command will parse what's on the current line in your editor and pre-populate a modal.
In the modal, you can change the task's description, its due date, and a recurrence rule to have a repeating task.
See below for more details on due dates and recurrence.
You cannot toggle a task (un)done in the modal.
For that, do one of the following.

There are two ways to mark a task done:

1. In preview mode, click the checkbox at the beginning of the task to toggle the status between "todo" and "done".
2. In edit mode, use the command `Tasks: Toggle Done`.
    - The command will only be available if the cursor is on a line with a checklist item.
    - You can map he command to a hotkey in order to quickly toggle statuses in the editor view (I recommend to replace the original "Toggle checklist status" with it).
    - If the checklist item is not a task (e.g. due to a global filter), the command will toggle it like a regular checklist item.

A "done" task will have the date it was done appended to the end of its line.
For example: `✅ 2021-04-09` means the task was done on the 9th of April, 2021.

### Filtering checklist items

ℹ You can set a global filter in the settings so that Tasks only matches specific checklist items.
For example, you could set it to `#tasks` to only track checklist items as task if they include the string `#tasks`.
It doesn't have to be a tag. It can be any string.
Leave it empty to regard all checklist items as tasks.

Example with global filter `#tasks`:

```
- [ ] #tasks take out the trash
```

If you don't have a global filter set, all regular checklist items work:

```
- [ ] take out the trash
```

### Due dates

Tasks can have due dates.
In order to specify the due date of a task, you must append the "due date signifier 📅" followed by the date it is due to the end of the task.
The date must be in the format `YYYY-MM-DD`, meaning `Year-Month-Day` with leading zeros.
For example: `📅 2021-04-09` means the task is due on the 9th of April, 2021.

```
- [ ] take out the trash 📅 2021-04-09
```

Instead of adding the emoji and the date manually, you can use the `Tasks: Create or edit` command when creating or editing a task.
When you use the command, you can also set a due date like "Monday", "tomorrow", or "next week" and Tasks will automatically save the date in the correct format.

**You can only put block links (`^link-name`) behind the due/done dates. Anything else will break the parsing of dates and recurrence rules.**

### Recurring tasks (repetition)

Tasks can be recurring.
In order to specify a recurrence rule of a task, you must append the "recurrence signifier 🔁" followed by the recurrence rule.
For example: `🔁 every weekday` means the task will repeat every week on Monday through Friday.
Every recurrence rule has to start with the word `every`.

When you toggle the status of a recurring task to anything but "todo" (i.e. "done"), the orginal task that you wanted to toggle will be marked as done and get the done date appended to it, like any other task.
In addition, *a new task will be put one line above the original task.*
The new task will have the due date of the next occurrence after the due date of the original task.

Take as an example the following task:

```
- [ ] take out the trash 🔁 every Sunday 📅 2021-04-25
```

If you mark the above task "done" on Saturday, the 24th of April, the file will now look like this:

```
-   [ ] take out the trash 🔁 every Sunday 📅 2021-05-02
-   [x] take out the trash 🔁 every Sunday 📅 2021-04-25 ✅ 2021-04-24
```

*For best compatibility, a recurring task should have a due date and the recurrence rule should appear before the due date of a task.*

In the editor there is no direct feedback to whether your recurrence rule is valid.
You can validate that tasks understands your rule by using the `Tasks: Crete or edit` command when creating or editing a task.

Examples of possible recurrence rules (mix and match as desired; these should be considered inspirational):

-   `🔁 every weekday` (meaning every Mon - Fri)
-   `🔁 every week on Sunday`
-   `🔁 every 2 weeks`
-   `🔁 every 3 weeks on Friday`
-   `🔁 every 2 months`
-   `🔁 every month on the 1st`
-   `🔁 every 6 months on the 1st Wednesday`
-   `🔁 every January on the 15th`
-   `🔁 every year`

### Querying and listing tasks

You can list tasks from your entire vault by querying them using a `tasks` code block. You can edit the tasks from the query results by clicking on the little pencil icon next to them.
Tasks are by default sorted by status, due date, and then path. You can change the sorting (see query options below).

**⚠️ The result list will list tasks unindented.**
See [#51](https://github.com/schemar/obsidian-tasks/issues/51) for a discussion around the topic.
Do not hesitate to contribute 😊

The simplest way to query tasks is this:

    ```tasks
    ```

In preview mode, this will list *all* tasks from your vault, regardless of their properties like status.
This is probably not what you want. Therefore, Tasks allows you to set query options to filter the tasks that you want to show.

The following query options exist:

- `done`
- `not done`
- `done (before|after|on) <date>`
- `no due date`
- `due (before|after|on) <date>`
- `is recurring`
- `is not recurring`
- `path (includes|does not include) <path>`
    - Matches case-insensitive (disregards capitalization).
- `description (includes|does not include) <string>`
    - Matches case-insensitive (disregards capitalization).
- `heading (includes|does not include) <string>`
    - Whether or not the heading preceding the task includes the given string.
    - Always tries to match the closest heading above the task, regardless of heading level.
    - `does not include` will match a task that does not have a preceding heading in its file.
    - Matches case-insensitive (disregards capitalization).
- `any heading (includes|does not include) <string>`
    - Same as above but also match parent headings
- `exclude sub-items`
    - When this is set, the result list will only include tasks that are not indented in their file. It will only show tasks that are top level list items in their list.
- `limit to <number> tasks`
    - Only lists the first `<number>` tasks of the result.
    - Shorthand is `limit <number>`.
- `sort by (status|due|done|path|description)`
    - Sorts the tasks by the given property.
    - For example, `sort by due` will sort the tasks by due date.
    - You cann add multiple `sort by` query options, each on an extra line.
        - The first sort has the highest priority.
        - Each subsequent `sort` will sort within the existing sorting.

#### Dates
`<date>` filters can be given in natural language or in formal notation.
The following are some examples of valid `<date>` filters as inspiration:
- `2021-05-05`
- `today`
- `tomorrow`
- `next monday`
- `last friday`
- `in two weeks`

Note that if it is Wednesday and you write `tuesday`, Tasks assumes you mean "yesterday", as that is the closest Tuesday.
Use `next tuesday` instead if you mean "next tuesday".

When the day changes, relative dates like `due today` are re-evaluated so that the list stays up-to-date.

#### Matching
All filters of a query have to match in order for a task to be listed.
This means you cannot show tasks that have "GitHub in the path and have no due date or are due after 2021-04-04".
Instead you would have two queries, one for each condition:

    ### Not due

    ```tasks
    no due date
    path includes GitHub
    ```

    ### Due after 2021-04-04

    ```tasks
    due after 2021-04-04
    path includes GitHub
    ```

#### Layout options
You can hide certain elements of the rendered list with the "hide" option.

The following options exist:

- `edit button`
- `backlink`
- `done date`
- `due date`
- `recurrence rule`
- `task count`

Example:

    ```tasks
    no due date
    path includes GitHub
    hide recurrence rule
    hide task count
    hide backlink
    ```

#### Examples

All open tasks that are due today:

    ```tasks
    not done
    due today
    ```

All open tasks that are due within the next two weeks, but are not overdue (due today or later):

    ```tasks
    not done
    due after yesterday
    due before in two weeks
    ```

All done tasks that are anywhere in the vault under a `tasks` heading (e.g. `## Tasks`):

    ```tasks
    done
    heading includes tasks
    ```

Show all tasks that aren't done, are due on the 9th of April 2021, and where the path includes `GitHub`:

    ```tasks
    not done
    due on 2021-04-09
    path includes GitHub
    ````

Show all open tasks that are due within two weeks and hide the due date and edit button:

    ```tasks
    not done
    due after 2021-04-30
    due before 2021-05-15
    hide due date
    hide edit button
    ```

Show all tasks that were done before the 1st of December 2020:

    ```tasks
    done before 2020-12-01
    ```

Show one task that is due on the 5th of May and includes `#prio1` in its description:

    ```tasks
    not done
    due on 2021-05-05
    description includes #prio1
    limit to 1 tasks
    ````

### Tips

#### Daily Agenda

Using the default `Daily-notes` plugin, **templates** with syntax like
`{{date+14d:YYYY-MM-DD}}` won't load dates properly. Nevertheless, **Liam Cain**,
author of both the [Calendar Plugin](https://github.com/liamcain/obsidian-calendar-plugin)
and [Periodic Notes Plugin](https://github.com/liamcain/obsidian-periodic-notes), has
written code to create new daily notes (using both plugins) using the `date+Xd` format.
Therefore, if you want to use this format instead of the standard `Daily-notes` syntax,
make sure new notes are created via one of these two plugins, and not `Daily-notes`.

- **Calendar Plugin**: Just tap the day on the Calendar UI and a new daily note will be created
- **Periodic Notes Plugin**: Install, migrate from `Daily-notes` if needed, and tap the new `Open Today` ribbon on the left-side dock. Below is an example if today was August 14, 2021.

| | Daily Notes | Calendar | Periodic Notes |
|-|-------------|----------|----------------|
| template syntax | `due on {{date+14d:YYYY-MM-DD}}` | `due on {{date+14d:YYYY-MM-DD}}` | `due on {{date+14d:YYYY-MM-DD}}` |
| output | `due on {{date+14d:YYYY-MM-DD}}` | `due on 2021-08-28` | `due on 2021-08-28` |

##### Example Daily Agenda **template**:

    ## Tasks
    ### Overdue
    ```tasks
    not done
    due before {{date:YYYY-MM-DD}}
    ```

    ### Due today
    ```tasks
    not done
    due on {{date:YYYY-MM-DD}}
    ```

    ### Due in the next two weeks
    ```tasks
    not done
    due after {{date:YYYY-MM-DD}}
    due before {{date+14d:YYYY-MM-DD}}
    ```

    ### No due date
    ```tasks
    not done
    no due date
    ```

    ### Done today
    ```tasks
    done on {{date:YYYY-MM-DD}}
    ```
    
#### Styling Tasks

Each task entry has CSS styles that allow you to change the look and feel of how the tasks are displayed. The 
following styles are avliable. 

| Class                    | Usage                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| plugin-tasks-query-result| This is applied to the UL used to hold all the tasks, each task is stored in a LI.                             |
| plugin-tasks-list-item   | This is applied to the LI that holds each task and the INPUT element for it.                                   |
| tasks-backlink           | This is applied to the SPAN that wraps the backlink if displayed on the task.                                  |
| tasks-edit               | This is applied to the SPAN that wraps the edit button/icon shown next to the task that opens the task edit UI.|
| task-list-item-checkbox  | This is applied to the INPUT element for the task.                                                             |

## Development
Clone the repository, run `yarn` to install the dependencies, and run `yarn dev` to compile the plugin and watch file changes.

## Donations
The plugin is completely free to use. If you love it very much and want to pay it forward, please consider donating to an organization of your choice.
Two example organizations that you could consider donating to are the Wikimedia Foundation and the Electronic Frontiers Foundation:

1. [Support the Wikimedia Foundation](https://wikimediafoundation.org/support/)
2. [Support EFF](https://supporters.eff.org/donate/join-eff-today)
