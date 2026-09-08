import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const STATE_ENTRY_TYPE = "openai-web-search-config";

interface WebSearchState {
	enabled: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function supportsHostedWebSearch(model: { provider?: string; api?: string } | undefined): boolean {
	return (
		(model?.provider === "openai" && model.api === "openai-responses") ||
		(model?.provider === "openai-codex" && model.api === "openai-codex-responses")
	);
}

function hasWebSearchTool(tools: unknown[]): boolean {
	return tools.some((tool) => isRecord(tool) && tool.type === "web_search");
}

export default function openAIWebSearchExtension(pi: ExtensionAPI) {
	let enabled = true;

	function restoreState(ctx: { sessionManager: { getBranch(): unknown[] } }) {
		enabled = true;
		for (const entry of ctx.sessionManager.getBranch()) {
			if (!isRecord(entry) || entry.type !== "custom" || entry.customType !== STATE_ENTRY_TYPE) continue;
			if (!isRecord(entry.data) || typeof entry.data.enabled !== "boolean") continue;
			enabled = entry.data.enabled;
		}
	}

	function statusText(model: { provider?: string; api?: string } | undefined): string {
		if (!enabled) return "OpenAI web search is off for this session.";
		if (supportsHostedWebSearch(model)) {
			return "Web search is on. The model can search when it is useful.";
		}
		return "Web search is on, but only applies to direct OpenAI or OpenAI Codex Responses API models.";
	}

	pi.on("session_start", (_event, ctx) => {
		restoreState(ctx);
	});

	pi.on("session_tree", (_event, ctx) => {
		restoreState(ctx);
	});

	pi.registerCommand("web-search", {
		description: "Toggle OpenAI Responses API web search: on, off, or status",
		handler: async (args, ctx) => {
			const action = args.trim().toLowerCase() || "status";
			if (action === "status") {
				ctx.ui.notify(statusText(ctx.model), "info");
				return;
			}
			if (action !== "on" && action !== "off") {
				ctx.ui.notify("Usage: /web-search [on|off|status]", "warning");
				return;
			}

			enabled = action === "on";
			pi.appendEntry<WebSearchState>(STATE_ENTRY_TYPE, { enabled });
			ctx.ui.notify(statusText(ctx.model), "info");
		},
	});

	pi.on("before_provider_request", (event, ctx) => {
		if (!enabled || !supportsHostedWebSearch(ctx.model) || !isRecord(event.payload)) return;

		const existingTools = Array.isArray(event.payload.tools) ? event.payload.tools : [];
		if (hasWebSearchTool(existingTools)) return;

		return {
			...event.payload,
			tools: [...existingTools, { type: "web_search" }],
		};
	});
}
