# How Layout arranges nodes

Layout is deterministic. The same tasks, links and settings give the same positions, and a change to one part of the graph moves only the nodes that have to move. This page describes the steps Layout takes and the reason for each, so that the result can be predicted and so that a crooked link can be traced to its cause.

## Steps

1. Linked groups. Tasks connected by dependencies, directly or through other tasks, form a group. Each group is laid out on its own with dagre, using the rendered size of every node, and the groups are then set side by side across the flow direction in the order their first task appears. A chain in one group is never pushed out of line by a task in another, and a tree is not stretched to make room for unrelated tasks that happen to share a rank.
2. Date axis. When it is on, dates decide the order of the levels along the flow, not the distance, and each level sits only as far from the previous one as its nodes need. Across the flow, dagre's order is kept. Nodes of one level that would touch are moved apart by the least total distance, symmetrically around where they were. Pushing every crowd the same way would add up from level to level and tilt a whole chain into a slant.
3. Lanes. **Group by** tag, note or priority only moves nodes across the flow, so the date axis stays as it is. Inside a lane, nodes that overlap along the flow go on separate tracks, and a task keeps the track of the task it depends on whenever that track is free at its level. When several tasks follow the same one, the task with the longest chain below it takes that track and the shorter branches take the nearest free tracks. A chain therefore stays in one column. Giving each task the first free track instead, without looking at links, makes a chain hop between tracks whenever a neighbor occupies its own.
4. Separate links. When it is on, a task that sits on the straight line of a longer link and has a link of its own along it is moved sideways, together with the others in the same situation.
5. Handles. Every link leaves the downstream side of its source and enters the upstream side of its target for the chosen direction, whatever the positions of the two nodes. Moving a node, or laying the graph out again, never makes a link jump to another side.
6. Rounding. Final positions are whole pixels, so equal layouts compare equal.

## What can be relied on

- Repeatable: the result depends on the tasks, the links, the settings and the rendered node sizes, and on nothing else.
- Local: editing one group leaves the nodes of every other group where they were.
- Fixed attachment: a link keeps its sides for as long as the direction setting is the same.

## What is not guaranteed

- Two predecessors: a task that depends on two tasks in different columns has at least one slanted link.
- Lane borders: a link between two lanes crosses the border and is slanted unless the two tasks happen to share a column.
- Long links: a link that spans several levels can pass behind a node in between. **Separate links** moves such a node aside for the common case.
- Level by level spreading: on the date axis each level is spread on its own, so a chain can shift slightly where a level is crowded.

A layout that assigns a column to every main chain before ordering the rest would make each main line exactly vertical. Layout does not do this yet.
