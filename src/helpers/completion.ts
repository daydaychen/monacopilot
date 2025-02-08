import {
    CompletionMode,
    CompletionRequestBody,
    CompletionResponse,
    RelatedFile,
} from 'types/completion';
import {
    ConstructCompletionMetadataParams,
    FetchCompletionItemParams,
    FetchCompletionItemReturn,
} from 'types/completion/internal';
import {CursorPosition, EditorModel} from 'types/monaco';

import {CONTENT_TYPE_JSON} from 'constants/misc';

import {
    getCharAfterCursor,
    getTextAfterCursor,
    getTextBeforeCursor,
} from 'utils/editor';
import {HTTP} from 'utils/http';
import {keepNLines} from 'utils/text';

export const fetchCompletionItem = async (
    params: FetchCompletionItemParams,
): Promise<FetchCompletionItemReturn> => {
    const {endpoint, body} = params;

    const {completion, error} = await HTTP.post<
        CompletionResponse,
        CompletionRequestBody
    >(endpoint, body, {
        headers: {
            'Content-Type': CONTENT_TYPE_JSON,
        },
        fallbackError: 'Error while fetching completion item',
    });

    if (error) {
        throw new Error(error);
    }

    return {completion};
};

export const constructCompletionMetadata = ({
    pos,
    mdl,
    options,
}: ConstructCompletionMetadataParams) => {
    const {filename, language, technologies, relatedFiles, maxContextLines} =
        options;

    const completionMode = determineCompletionMode(pos, mdl);

    // Determine the divisor based on the presence of related files
    const hasRelatedFiles = !!relatedFiles?.length;
    const divisor = hasRelatedFiles ? 3 : 2;
    const adjustedMaxContextLines = maxContextLines
        ? Math.floor(maxContextLines / divisor)
        : undefined;

    const limitText = (
        getTextFn: (pos: CursorPosition, mdl: EditorModel) => string,
        maxLines?: number,
        options?: {from?: 'start' | 'end'},
    ): string => {
        const text = getTextFn(pos, mdl);
        return maxLines ? keepNLines(text, maxLines, options) : text;
    };

    const processRelatedFiles = (
        files?: RelatedFile[],
        maxLines?: number,
    ): RelatedFile[] | undefined => {
        if (!files || !maxLines) return files;

        return files.map(({content, ...rest}) => ({
            ...rest,
            content: keepNLines(content, maxLines),
        }));
    };

    // Retrieve and limit text around the cursor position
    const textBeforeCursor = limitText(
        getTextBeforeCursor,
        adjustedMaxContextLines,
        {
            from: 'end',
        },
    );
    const textAfterCursor = limitText(
        getTextAfterCursor,
        adjustedMaxContextLines,
    );

    // Process related files with the adjusted maximum lines
    const limitedRelatedFiles = processRelatedFiles(
        relatedFiles,
        adjustedMaxContextLines,
    );

    return {
        filename,
        language,
        technologies,
        relatedFiles: limitedRelatedFiles,
        textBeforeCursor,
        textAfterCursor,
        cursorPosition: pos,
        editorState: {
            completionMode,
        },
    };
};

const determineCompletionMode = (
    pos: CursorPosition,
    mdl: EditorModel,
): CompletionMode => {
    const charAfterCursor = getCharAfterCursor(pos, mdl);
    const textAfterCursor = getTextAfterCursor(pos, mdl);

    if (charAfterCursor) {
        return 'insert';
    }

    if (textAfterCursor.trim()) {
        return 'complete';
    }

    return 'continue';
};
