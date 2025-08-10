export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  functionCalls?: FunctionCall[];
  proposedPlan?: AIActionPlan;
}

export interface GroundingChunk {
    web: {
        uri: string;
        title: string;
    }
}

export interface FunctionCall {
    name?: string;
    args?: object;
}

export interface Tool {
    functionDeclarations: FunctionDeclaration[];
}

export interface FunctionDeclaration {
    name: string;
    description: string;
    parameters: object;
}

// Types for Digital Workshop AI Actions
export type AIAction = "CREATE_FILE" | "UPDATE_FILE" | "DELETE_FILE" | "RENAME_FILE";

export interface AIActionOperation {
    action: AIAction;
    path: string;
    content?: string;
    newPath?: string;
}

export interface AIActionPlan {
    thought: string;
    operations: AIActionOperation[];
}
