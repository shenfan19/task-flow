# Lanes

![Grouping tasks by tag, switching the order to soft pull, grouping by priority, then turning lanes off](../images_ai/lanes.gif)

In **View**, **Group by** puts tasks that share a tag, a note or a priority in one column, or one row in a left to right layout. It is **None**, no lanes, until you pick another.

## What a lane is

Each lane is a tinted band with its name along the edge of the view.

- Tag: the lane takes the tag's own color.
- File: the lane is named by the note's file name, with the folder added when two notes share a name.
- Priority: the lanes go from Highest down to Lowest, with None last.

A task belongs to one lane. A task with several tags goes in the lane of the tag most tasks share, and tasks without a tag go in the last lane.

## Inside a lane

Lanes only move nodes across the flow, so the date axis and every node's place along it stay as they were. Tasks that overlap along the flow in one lane are put side by side on separate tracks, and the lane widens to fit. A task stays on the track of the task it depends on whenever that track is free, so a chain keeps one column. Of several tasks that follow the same one, the one with the longest chain below it takes that track, and the shorter branches take the nearest free ones.

## Order

**Order** arranges the lanes.

- Auto: ordered by where the lane's tasks already were, then adjusted so that lanes with many links between them are neighbors.
- A-Z: alphabetical, which never changes when the graph does.
- Biggest first: the lane with the most tasks first.
- Soft pull: tasks are only drawn toward the center of their lane instead of being forced into columns, so the shape of the usual layout still shows. Bands follow the tasks and may touch.

Priority lanes always keep the order of the levels, so only **Soft pull** differs from **Auto** there, and A-Z and Biggest first are not offered.

## Good to know

Lanes are applied at **Layout**, like every other arrangement, and nodes can still be dragged by hand afterwards. With many tags or notes the graph gets wide. Filter some out first, or use **Soft pull**.

Back to the [manual](index.md).
