# pi-openai-web-search

[Pi](https://pi.dev) extension that enables OpenAI's hosted web-search tool for direct OpenAI Responses API models.

## Features

- adds OpenAI's current `{ type: "web_search" }` hosted tool to every eligible request
- leaves search decisions to the model
- uses OpenAI's default `search_context_size` (`medium`)
- preserves Pi's existing local tools alongside web search
- provides a session-scoped `/web-search` toggle

## Requirements

- pi with an OpenAI API key configured through `/login` or `OPENAI_API_KEY`
- a direct OpenAI model using the Responses API

The extension does not enable web search for OpenAI-compatible proxies, OpenAI Codex subscription models, or non-OpenAI providers.

## Setup

1. Install the extension:
   ```bash
   pi install git:github.com/fxwin/pi-openai-web-search
   ```

2. Reload pi:
   ```bash
   /reload
   ```

3. Select a direct OpenAI model and ask a question that benefits from current information. The model decides whether to search.

## Commands

```text
/web-search on
/web-search off
/web-search status
```

Web search is enabled by default. The toggle is stored in the current session and follows session-tree navigation. A new session starts enabled.

## Notes

OpenAI charges separately for hosted web-search calls. Pi currently streams the answer normally; OpenAI's search progress and structured citation metadata are not rendered separately by this extension.
