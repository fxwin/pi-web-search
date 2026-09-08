# pi-web-search

[Pi](https://pi.dev) extension that enables hosted web search for supported providers. It currently supports direct OpenAI and OpenAI Codex Responses API models.

## Features

- adds OpenAI's current `{ type: "web_search" }` hosted tool to every eligible request
- leaves search decisions to the model
- uses a configurable `search_context_size` (`low`, `medium`, or `high`), defaulting to `medium`
- preserves Pi's existing local tools alongside web search
- provides a session-scoped `/websearch` toggle and context-size setting
- shows a right-aligned `web search: on/off` indicator above the text input

## Requirements

- pi authenticated with an OpenAI API key or OpenAI Codex subscription through `/login`
- a direct OpenAI or OpenAI Codex model using the Responses API

The extension does not enable web search for OpenAI-compatible proxies or non-OpenAI providers.

## Setup

1. Install the extension:
   ```bash
   pi install git:github.com/fxwin/pi-web-search
   ```

2. Reload pi:
   ```bash
   /reload
   ```

3. Select a direct OpenAI or OpenAI Codex model and ask a question that benefits from current information. The model decides whether to search.

## Commands

```text
/websearch
/websearch low
/websearch medium
/websearch high
/websearch status
```

Web search is enabled by default. `/websearch` toggles it on or off; `/websearch <size>` sets the context size and enables search. The settings are stored in the current session and follow session-tree navigation. A new session starts enabled with medium context.

## Notes

OpenAI charges separately for hosted web-search calls. Pi currently streams the answer normally; OpenAI's search progress and structured citation metadata are not rendered separately by this extension.
