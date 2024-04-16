'use client';

import {Editor} from 'ai-monaco-editor';

export default function Home() {
  return (
    <main className="flex min-h-screen w-screen flex-col items-center gap-6 py-32 px-6">
      <Editor
        language="python"
        endpoint="/api/auto-complete"
        className="h-[300px] w-[300px] border"
      />
    </main>
  );
}
