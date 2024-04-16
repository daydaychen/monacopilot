import * as monaco from 'monaco-editor';

import Config from '../classes/config';
import {
  CompletionProviderType,
  CompletionRequestParams,
} from '../types/completion';

export const fetchCompletionItem = async ({
  code,
  language,
  framework,
  token,
}: CompletionRequestParams & {token: monaco.CancellationToken}) => {
  const endpoint = Config.getEndpoint();

  const controller = new AbortController();

  if (!endpoint) {
    return null;
  }

  const body = {
    code,
    language,
    framework,
  } satisfies CompletionRequestParams;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (token.isCancellationRequested) {
    controller.abort();

    return null;
  }

  const data = await response.json();

  return extractCompletionFromResponse(data);
};

const extractCompletionFromResponse = (data: any): string => {
  const completion: Record<CompletionProviderType, string> = {
    openai: data.choices[0].message.content,
  };

  const provider = Config.getProvider();

  return parseCompletion(completion[provider]);
};

const parseCompletion = (completion: string | null) => {
  if (!completion) {
    return null;
  }

  if (completion.startsWith('```json') && completion.endsWith('```')) {
    completion = completion.slice(7, -3);
  }

  try {
    return JSON.parse(completion).code_i_write;
  } catch (error) {
    return null;
  }
};

// Extract the code from the editor value and insert a placeholder at the cursor position
export const extractCodeForCompletion = (
  editorValue: string,
  cursorPosition: monaco.Position,
) => {
  const lineNumber = cursorPosition.lineNumber - 1;
  const column = cursorPosition.column - 1;

  const lines = editorValue.split('\n');

  lines[lineNumber] =
    lines[lineNumber].substring(0, column) +
    '{cursor}' +
    lines[lineNumber].substring(column);

  return lines.join('\n');
};

export const computeCacheKeyForCompletion = (
  position: monaco.Position,
  value: string,
) => `${position.lineNumber}:${position.column}:${value}`;
