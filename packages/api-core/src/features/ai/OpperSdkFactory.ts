import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";

/*
 * Opper model ids are pool names without a vendor prefix, so a stored model looks like
 * "opper/claude-sonnet-5-5". A pool is every provider that serves the model, and Opper picks the
 * route per request.
 */
const OPPER_MODELS: IAiSdkModel[] = [
    { id: "mistral-large-4", name: "Mistral Large 4" },
    { id: "gpt-6.1-sol", name: "GPT-6.1 Sol" },
    { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5" },
    { id: "qwen3.8-max", name: "Qwen3.8-Max" },
    { id: "glm-5.3", name: "GLM-5.3" },
    { id: "gpt-6-sol", name: "GPT-6 Sol" },
    { id: "gpt-6-luna", name: "GPT-6 Luna" },
    { id: "claude-opus-5-5", name: "Claude Opus 5.5" },
    { id: "grok-4.7", name: "Grok 4.7" },
    { id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash" },
    { id: "gpt-6-astra", name: "GPT-6 Astra" },
    { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash" },
    { id: "claude-fable-5-1", name: "Claude Fable 5.1" },
    { id: "claude-opus-5", name: "Claude Opus 5" },
    { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite" },
    { id: "kimi-k3", name: "Kimi K3" },
    { id: "gpt-5.6-terra", name: "GPT-5.6 Terra" },
    { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" }
];

class OpperSdkFactoryImpl implements AiSdkFactoryAbstraction.Interface {
    readonly id = "opper";
    readonly name = "Opper";
    readonly models = OPPER_MODELS;

    async execute(apiKey?: string): Promise<IAiSdk> {
        const { createOpper } = await import("@opperai/ai-sdk-provider");
        const provider = createOpper({
            apiKey: apiKey ?? process.env.WEBINY_API_OPPER_API_KEY
        });
        return {
            languageModel: modelId => provider.chatModel(modelId)
        };
    }
}

export const OpperSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: OpperSdkFactoryImpl,
    dependencies: []
});
