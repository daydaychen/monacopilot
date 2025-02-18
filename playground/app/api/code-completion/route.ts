import {NextRequest, NextResponse} from 'next/server';

import {CompletionCopilot} from 'monacopilot';

const copilot = new CompletionCopilot(process.env.OPENAI_API_KEY, {
    provider: 'openai',
    model: 'gpt-4o-mini',
});

export async function POST(req: NextRequest) {
    const body = await req.json();

    const {completion, error} = await copilot.complete({
        body,
    });

    if (error) {
        return NextResponse.json(
            {completion: null, error: error},
            {status: 500},
        );
    }

    return NextResponse.json({completion}, {status: 200});
}
