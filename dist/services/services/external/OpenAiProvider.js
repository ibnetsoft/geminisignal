"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiProvider = void 0;
// services/services/external/OpenAiProvider.ts
const openai_1 = __importDefault(require("openai"));
class OpenAiProvider {
    constructor(apiKey, firestoreInstance, model = 'gpt-4-turbo', apiHost) {
        this.openai = new openai_1.default({
            apiKey: apiKey,
            baseURL: apiHost, // for Grok
        });
        this.model = model;
        this.db = firestoreInstance;
    }
    async analyzeSignal(signal, marketContext, strategyGuide) {
        const prompt = this.createAnalysisPrompt(signal, marketContext.newsInsights || [], marketContext.upcomingEvents || [], strategyGuide);
        return await this.generateAndParse(prompt);
    }
    async analyzeOpenPosition(position, marketContext, exitGuide) {
        const prompt = this.createPositionAnalysisPrompt(position, marketContext, exitGuide);
        return await this.generateAndParse(prompt);
    }
    async generateAndParse(prompt) {
        try {
            const chatCompletion = await this.openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.model,
                response_format: { type: 'json_object' },
            });
            const resultText = chatCompletion.choices[0].message.content;
            if (!resultText) {
                throw new Error('OpenAI API response is empty');
            }
            const parsedResult = JSON.parse(resultText);
            const usage = {
                promptTokens: chatCompletion.usage?.prompt_tokens,
                completionTokens: chatCompletion.usage?.completion_tokens,
                totalTokens: chatCompletion.usage?.total_tokens,
            };
            return { output: parsedResult, usage };
        }
        catch (error) {
            console.error('❌ OpenAI/Grok API call or parsing error:', error);
            throw error;
        }
    }
    // Prompt creation methods (placeholders, similar to GeminiProvider)
    createAnalysisPrompt(signal, newsInsights, upcomingEvents, strategyGuide) {
        // This should be a comprehensive prompt template.
        return JSON.stringify({
            signal,
            newsInsights,
            upcomingEvents,
            strategyGuide,
            instruction: "Analyze the following signal and provide a recommendation in JSON format."
        });
    }
    createPositionAnalysisPrompt(position, context, exitGuide) {
        // This should be a comprehensive prompt template.
        return JSON.stringify({
            position,
            context,
            exitGuide,
            instruction: "Analyze the following open position and provide a recommendation in JSON format."
        });
    }
}
exports.OpenAiProvider = OpenAiProvider;
