import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";

const STATE_ENTRY_TYPE = "web-search-config";
const SEARCH_CONTEXT_SIZES = ["low", "medium", "high"];

interface WebSearchState {
	enabled: boolean;
	contextSize: string;
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
	let contextSize = "medium";

	function updateStatus(ctx: { ui: { setWidget(id: string, content: unknown, options?: { placement?: "aboveEditor" | "belowEditor" }): void } }) {
		ctx.ui.setWidget(
			"web-search",
			(_tui: unknown, theme: { fg(color: string, text: string): string }) => {
				const text =
					theme.fg("dim", "web search: ") + theme.fg(enabled ? "text" : "dim", enabled ? "on" : "off");
				return {
					render(width: number) {
						return [" ".repeat(Math.max(0, width - visibleWidth(text))) + text];
					},
					invalidate() {},
				};
			},
			{ placement: "aboveEditor" },
		);
	}

	function restoreState(ctx: {
		sessionManager: { getBranch(): unknown[] };
		ui: {
			setWidget(
				id: string,
				content: unknown,
				options?: { placement?: "aboveEditor" | "belowEditor" },
			): void;
		};
	}) {
		enabled = true;
		contextSize = "medium";
		for (const entry of ctx.sessionManager.getBranch()) {
			if (!isRecord(entry) || entry.type !== "custom" || entry.customType !== STATE_ENTRY_TYPE) continue;
			if (!isRecord(entry.data) || typeof entry.data.enabled !== "boolean") continue;
			enabled = entry.data.enabled;
			if (typeof entry.data.contextSize === "string" && SEARCH_CONTEXT_SIZES.includes(entry.data.contextSize)) {
				contextSize = entry.data.contextSize;
			}
		}
		updateStatus(ctx);
	}

	function statusText(model: { provider?: string; api?: string } | undefined): string {
		if (!enabled) return "Web search is off for this session.";
		if (supportsHostedWebSearch(model)) {
			return `Web search is on (${contextSize}). The model can search when it is useful.`;
		}
		return "Web search is on, but only applies to direct OpenAI or OpenAI Codex Responses API models.";
	}

	pi.on("session_start", (_event, ctx) => {
		restoreState(ctx);
	});

	pi.on("session_tree", (_event, ctx) => {
		restoreState(ctx);
	});

	pi.on("session_shutdown", (_event, ctx) => {
		ctx.ui.setWidget("web-search", undefined);
	});

	pi.registerCommand("websearch", {
		description: "Toggle web search or set its search context size",
		handler: async (args, ctx) => {
			const value = args.trim().toLowerCase();
			if (!value) {
				enabled = !enabled;
			} else if (SEARCH_CONTEXT_SIZES.includes(value)) {
				contextSize = value;
				enabled = true;
			} else if (value === "on" || value === "off") {
				enabled = value === "on";
			} else if (value === "status") {
				ctx.ui.notify(`${statusText(ctx.model)} Context size: ${contextSize}.`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /websearch [low|medium|high|on|off|status]", "warning");
				return;
			}

			pi.appendEntry<WebSearchState>(STATE_ENTRY_TYPE, { enabled, contextSize });
			updateStatus(ctx);
			ctx.ui.notify(statusText(ctx.model), "info");
		},
	});

	pi.on("before_provider_request", (event, ctx) => {
		if (!enabled || !supportsHostedWebSearch(ctx.model) || !isRecord(event.payload)) return;

		const existingTools = Array.isArray(event.payload.tools) ? event.payload.tools : [];
		if (hasWebSearchTool(existingTools)) return;

		return {
			...event.payload,
			tools: [...existingTools, { type: "web_search", search_context_size: contextSize }],
		};
	});
}
