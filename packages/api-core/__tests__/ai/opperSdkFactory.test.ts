import { Container } from "@webiny/di";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { generateText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { Ai } from "~/features/ai/Ai.js";
import { Ai as AiAbstraction } from "~/features/ai/abstractions.js";
import { AiConnectionFactory } from "~/features/ai/abstractions.js";
import { AiModelRegistry } from "~/features/ai/abstractions.js";
import { AiSdkFactory } from "~/features/ai/abstractions.js";
import type { AiModel } from "~/features/ai/abstractions.js";
import { OpperSdkFactory } from "~/features/ai/OpperSdkFactory.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

const model: AiModel = {
    providerId: "opper",
    providerName: "Opper",
    modelId: "claude-sonnet-5-5",
    modelName: "Claude Sonnet 5.5",
    deprecated: undefined,
    endOfLife: undefined,
    supports: undefined
};

const chatCompletion = {
    id: "chatcmpl-1",
    created: 0,
    model: "claude-sonnet-5-5",
    choices: [
        {
            message: { role: "assistant", content: "ok" },
            finish_reason: "stop"
        }
    ],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
};

const createLanguageModel = () =>
    new MockLanguageModelV4({
        doGenerate: {
            content: [{ type: "text", text: "ok" }],
            finishReason: { unified: "stop", raw: undefined },
            usage: {
                inputTokens: {
                    total: 1,
                    noCache: undefined,
                    cacheRead: undefined,
                    cacheWrite: undefined
                },
                outputTokens: { total: 1, text: undefined, reasoning: undefined }
            },
            warnings: []
        }
    });

describe("OpperSdkFactory", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("builds an Opper chat model for a pool name", async () => {
        const container = new Container();
        container.register(OpperSdkFactory);
        const factory = container.resolve(AiSdkFactory);

        const sdk = await factory.execute("op-test");
        const languageModel = sdk.languageModel("claude-sonnet-5-5");

        expect(factory.id).toBe("opper");
        expect(languageModel).toMatchObject({
            provider: "opper.chat",
            modelId: "claude-sonnet-5-5"
        });
    });

    it("passes the pool name after the first slash to the SDK", async () => {
        const languageModel = createLanguageModel();
        const requestedModelIds: string[] = [];

        const container = new Container();
        container.registerInstance(AiSdkFactory, {
            id: "opper",
            name: "Opper",
            models: [],
            execute: async () => ({
                languageModel: modelId => {
                    requestedModelIds.push(modelId);
                    return languageModel;
                }
            })
        });
        container.registerInstance(AiConnectionFactory, {
            execute: async () => ({ id: "opper", sdkName: "opper" })
        });
        container.registerInstance(EventPublisher, { publish: vi.fn() } as any);
        container.registerInstance(AiModelRegistry, { listModels: async () => [model] });
        container.register(Ai);

        await container.resolve(AiAbstraction).generateText({
            model: "opper/claude-sonnet-5-5",
            prompt: "Hi"
        });

        expect(requestedModelIds).toEqual(["claude-sonnet-5-5"]);
    });

    it("sends the call to the OpenAI-compatible endpoint with the key", async () => {
        const fetchMock = vi.fn<Fetch>(async () => Response.json(chatCompletion));
        vi.stubGlobal("fetch", fetchMock);

        const container = new Container();
        container.register(OpperSdkFactory);
        const factory = container.resolve(AiSdkFactory);
        const sdk = await factory.execute("op-test");
        const languageModel = sdk.languageModel("claude-sonnet-5-5");

        const result = await generateText({ model: languageModel, prompt: "Hi" });

        const [url, init] = fetchMock.mock.calls[0];
        const headers = new Headers(init.headers);
        expect(result.text).toBe("ok");
        expect(url).toBe("https://api.opper.ai/v3/compat/chat/completions");
        expect(headers.get("authorization")).toBe("Bearer op-test");
    });
});
