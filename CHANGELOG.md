# Changelog

## 0.1.2

### Changed

- Requires Obsidian 1.7.2 or later, the first version where the API used to bring the graph view to the front can be awaited.
- Releases are built on GitHub Actions and carry artifact attestations, so each release can be verified against the source.

## 0.1.1

### Changed

- The graph view opens with the command **Task Flow: Open graph view** or the ribbon icon **Open task graph**.
- Periodic refresh and layout use Obsidian's window timers, so they also work when the view is in a popout window.
- The plugin reaches Obsidian through its own instance instead of the global `app` object.
- Requires Obsidian 1.5.1 or later.

## 0.1.0

- Initial release.
