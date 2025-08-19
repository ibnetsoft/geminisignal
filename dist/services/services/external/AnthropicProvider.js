"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
// services/services/external/AnthropicProvider.ts
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class AnthropicProvider {
    constructor(apiKey, firestoreInstance, model = 'claude-3-opus-20240229') {
        this.anthropic = new sdk_1.default({ apiKey });
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
            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
                system: "You are a financial analyst. Respond in JSON format.",
            });
            // Assuming content is an array of blocks and the first block is text
            const resultText = response.content[0].type === 'text' ? response.content[0].text : null;
            if (!resultText) {
                throw new Error('Anthropic API response is empty or not text.');
            }
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('AI response does not contain valid JSON.');
            }
            const parsedResult = JSON.parse(jsonMatch[0]);
            const usage = {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            };
            return { output: parsedResult, usage };
        }
        catch (error) {
            console.error('❌ Anthropic API call or parsing error:', error);
            throw error;
        }
    }
    // Prompt creation methods (placeholders)
    createAnalysisPrompt(signal, newsInsights, upcomingEvents, strategyGuide) {
        return JSON.stringify({
            signal,
            newsInsights,
            upcomingEvents,
            strategyGuide,
            instruction: "Analyze the following signal and provide a recommendation in JSON format inside a ```json block."
        });
    }
    createPositionAnalysisPrompt(position, context, exitGuide) {
        return JSON.stringify({
            position,
            context,
            exitGuide,
            instruction: "Analyze the following open position and provide a recommendation in JSON format inside a ```json block."
        });
    }
}
exports.AnthropicProvider = AnthropicProvider;
