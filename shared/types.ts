// Shared TypeScript definitions for AtomiX

export interface UserProfile {
    id: string;
    email: string;
    plan: 'free' | 'pro';
    subscription_status: 'active' | 'cancelled' | 'past_due' | 'none';
    generations_count: number;
    generations_limit: number;
    lava_contract_id?: string;
    created_at: string;
}

export interface ExtensionSettings {
    tone: string;
    language: string;
    length: string;
    custom_prompts: CustomPrompt[];
    banned_words: string[];
}

export interface CustomPrompt {
    id: string;
    name: string;
    prompt: string;
}
