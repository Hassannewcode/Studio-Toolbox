export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  functionCalls?: FunctionCall[];
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