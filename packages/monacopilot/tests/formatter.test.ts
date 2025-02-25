import {describe, expect, it} from 'vitest';

import {CompletionFormatter} from '../src/classes/formatter';
import {MOCK_COMPLETION_POS} from './mock';

describe('CompletionFormatter', () => {
    describe('create', () => {
        it('should create a new instance of CompletionFormatter', () => {
            const formatter = new CompletionFormatter(
                'const greeting = "Hello, World!";',
                MOCK_COMPLETION_POS.column,
                '',
            );
            expect(formatter).toBeInstanceOf(CompletionFormatter);
        });
    });

    describe('removeInvalidLineBreaks', () => {
        it('should remove trailing line breaks', () => {
            const formatter = new CompletionFormatter(
                'function sum(a, b) {\n  return a + b;\n}\n\n',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeInvalidLineBreaks().build();
            expect(result).toBe('function sum(a, b) {\n  return a + b;\n}');
        });

        it('should not remove line breaks in the middle of the text', () => {
            const formatter = new CompletionFormatter(
                'const x = 5;\nconst y = 10;\nconst sum = x + y;',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeInvalidLineBreaks().build();
            expect(result).toBe(
                'const x = 5;\nconst y = 10;\nconst sum = x + y;',
            );
        });

        it('should handle empty string', () => {
            const formatter = new CompletionFormatter(
                '',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeInvalidLineBreaks().build();
            expect(result).toBe('');
        });
    });

    describe('removeMarkdownCodeSyntax', () => {
        it('should remove markdown code block syntax', () => {
            const formatter = new CompletionFormatter(
                '```\nconst array = [1, 2, 3];\narray.map(x => x * 2);\n```',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe(
                'const array = [1, 2, 3];\narray.map(x => x * 2);',
            );
        });

        it('should remove markdown code block in the middle of the text', () => {
            const formatter = new CompletionFormatter(
                'calculate the factorial of a given number using recursion\n```javascript\nfunction calculateFactorial(n) {\n    // Base case: factorial of 0 or 1 is 1\n    if (n === 0 || n === 1) {\n        return 1;\n    ',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe(
                'calculate the factorial of a given number using recursion\nfunction calculateFactorial(n) {\n    // Base case: factorial of 0 or 1 is 1\n    if (n === 0 || n === 1) {\n        return 1;\n    ',
            );
        });

        it('should remove multiple markdown code blocks', () => {
            const formatter = new CompletionFormatter(
                '```\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```\nSome text\n```\nconst result = greet("Alice");\nconsole.log(result);\n```',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe(
                'function greet(name) {\n  return `Hello, ${name}!`;\n}\nSome text\nconst result = greet("Alice");\nconsole.log(result);',
            );
        });

        it('should handle code blocks with language specifiers', () => {
            const formatter = new CompletionFormatter(
                '```javascript\nclass Person {\n  constructor(name) {\n    this.name = name;\n  }\n}\n```',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe(
                'class Person {\n  constructor(name) {\n    this.name = name;\n  }\n}',
            );
        });

        it('should not modify text without code blocks', () => {
            const formatter = new CompletionFormatter(
                'const PI = 3.14159;',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe('const PI = 3.14159;');
        });

        it('should handle empty string', () => {
            const formatter = new CompletionFormatter(
                '',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe('');
        });

        it('should handle incomplete code blocks', () => {
            const formatter = new CompletionFormatter(
                '```\nconst incomplete = true;',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe('const incomplete = true;');
        });

        it('should keep starting whitespaces', () => {
            const formatter = new CompletionFormatter(
                ' 3.14159;',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe(' 3.14159;');
        });

        it('should keep leading newlines', () => {
            const formatter = new CompletionFormatter(
                '\nconst PI = 3.14159;',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe('\nconst PI = 3.14159;');
        });

        it('should preserve leading newline with code block', () => {
            const formatter = new CompletionFormatter(
                '\n```\nconst x = 5;\n```',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeMarkdownCodeSyntax().build();
            expect(result).toBe('\nconst x = 5;');
        });
    });

    describe('removeExcessiveNewlines', () => {
        it('should replace three or more consecutive newlines with two newlines', () => {
            const formatter = new CompletionFormatter(
                'import React from "react";\n\n\n\nconst App = () => {\n  return <div>Hello React</div>;\n};',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeExcessiveNewlines().build();
            expect(result).toBe(
                'import React from "react";\n\nconst App = () => {\n  return <div>Hello React</div>;\n};',
            );
        });

        it('should not modify text with two or fewer consecutive newlines', () => {
            const formatter = new CompletionFormatter(
                'const x = 10;\n\nconst y = 20;',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeExcessiveNewlines().build();
            expect(result).toBe('const x = 10;\n\nconst y = 20;');
        });

        it('should handle multiple occurrences of excessive newlines', () => {
            const formatter = new CompletionFormatter(
                'function add(a, b) {\n  return a + b;\n}\n\n\nfunction subtract(a, b) {\n  return a - b;\n}\n\n\n\nconst result = add(5, 3);',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeExcessiveNewlines().build();
            expect(result).toBe(
                'function add(a, b) {\n  return a + b;\n}\n\nfunction subtract(a, b) {\n  return a - b;\n}\n\nconst result = add(5, 3);',
            );
        });

        it('should handle empty string', () => {
            const formatter = new CompletionFormatter(
                '',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeExcessiveNewlines().build();
            expect(result).toBe('');
        });

        it('should handle string with only newlines', () => {
            const formatter = new CompletionFormatter(
                '\n\n\n\n',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeExcessiveNewlines().build();
            expect(result).toBe('\n\n');
        });

        it('should maintain single leading newline', () => {
            const formatter = new CompletionFormatter(
                '\nconst x = 10;\n\nconst y = 20;',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.removeExcessiveNewlines().build();
            expect(result).toBe('\nconst x = 10;\n\nconst y = 20;');
        });
    });

    describe('indentByColumn', () => {
        it('should not modify a single-line completion', () => {
            const input = 'Hello world';
            const formatter = new CompletionFormatter(input, 5, '');
            formatter.indentByColumn();
            expect(formatter.build()).toBe('Hello world');
        });

        it('should not modify multi-line completions if textBeforeCursorInLine is non-empty', () => {
            const input = 'First line\nSecond line';
            const formatter = new CompletionFormatter(input, 5, 'non-empty');
            formatter.indentByColumn();
            expect(formatter.build()).toBe(input);
        });

        it('should correctly indent multi-line completion when textBeforeCursorInLine is empty', () => {
            const input =
                '    function test() {' +
                '\n        console.log("hello");' +
                '\n    }';
            const formatter = new CompletionFormatter(input, 5, '');
            formatter.indentByColumn();
            const expected =
                'function test() {' +
                '\n' +
                '    ' +
                '    console.log("hello");' +
                '\n' +
                '    ' +
                '}';
            expect(formatter.build()).toBe(expected);
        });

        it('should handle case where first line indent is larger than subsequent line indent', () => {
            const input = '        First line' + '\n' + '    Second line';
            const formatter = new CompletionFormatter(input, 3, '');
            formatter.indentByColumn();
            const expected = 'First line' + '\n' + '  ' + 'Second line';
            expect(formatter.build()).toBe(expected);
        });

        it('should handle case where first line indent is smaller than subsequent line indent', () => {
            const input = '  First line' + '\n' + '      Second line';
            const formatter = new CompletionFormatter(input, 4, '');
            formatter.indentByColumn();
            const expected = 'First line' + '\n' + '   ' + '    Second line';
            expect(formatter.build()).toBe(expected);
        });

        it('should work correctly with empty subsequent lines', () => {
            const input = '    First line' + '\n    ' + '\n    Third line';
            const formatter = new CompletionFormatter(input, 6, '');
            formatter.indentByColumn();
            const expected =
                'First line' +
                '\n' +
                '     ' +
                '' +
                '\n' +
                '     ' +
                'Third line';
            expect(formatter.build()).toBe(expected);
        });

        it('should work correctly when currentColumn is 1 (no extra prefix added)', () => {
            const input = '  Test' + '\n' + '    Line';
            const formatter = new CompletionFormatter(input, 1, '');
            formatter.indentByColumn();
            const expected = 'Test' + '\n' + '  Line';
            expect(formatter.build()).toBe(expected);
        });

        it('should preserve newlines while adjusting indentations', () => {
            const input = 'First line\nSecond line\nThird line';
            const formatter = new CompletionFormatter(input, 4, '');
            formatter.indentByColumn();
            const expected =
                'First line' +
                '\n' +
                '   ' +
                'Second line' +
                '\n' +
                '   ' +
                'Third line';
            expect(formatter.build()).toBe(expected);
        });

        it('should handle when the first line is only whitespace', () => {
            const input = '    ' + '\n' + '        Text after blank first line';
            const formatter = new CompletionFormatter(input, 3, '');
            formatter.indentByColumn();
            const expected =
                '' + '\n' + '  ' + '    Text after blank first line';
            expect(formatter.build()).toBe(expected);
        });

        it('should not alter an empty string', () => {
            const input = '';
            const formatter = new CompletionFormatter(input, 4, '');
            formatter.indentByColumn();
            expect(formatter.build()).toBe('');
        });

        it('should treat textBeforeCursorInLine as empty when it contains only whitespace', () => {
            const input = '    Alpha' + '\n' + '        Beta';
            const formatter = new CompletionFormatter(input, 5, '   ');
            formatter.indentByColumn();
            const expected = 'Alpha' + '\n' + '    ' + '    Beta';
            expect(formatter.build()).toBe(expected);
        });
    });

    describe('build', () => {
        it('should return the formatted completion', () => {
            const formatter = new CompletionFormatter(
                '  const square = (x) => x * x;  ',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter.build();
            expect(result).toBe('  const square = (x) => x * x;  ');
        });
    });

    describe('chaining methods', () => {
        it('should allow chaining of multiple formatting methods', () => {
            const formatter = new CompletionFormatter(
                '```\nconst fruits = ["apple", "banana", "orange"];\nconst upperFruits = fruits.map(fruit => fruit.toUpperCase());\n```\n\n\n\nconsole.log(upperFruits);',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter
                .removeMarkdownCodeSyntax()
                .removeExcessiveNewlines()
                .removeInvalidLineBreaks()
                .build();
            expect(result).toBe(
                'const fruits = ["apple", "banana", "orange"];\nconst upperFruits = fruits.map(fruit => fruit.toUpperCase());\n\nconsole.log(upperFruits);',
            );
        });

        it('should handle empty string with all formatting methods', () => {
            const formatter = new CompletionFormatter(
                '',
                MOCK_COMPLETION_POS.column,
                '',
            );
            const result = formatter
                .removeMarkdownCodeSyntax()
                .removeExcessiveNewlines()
                .removeInvalidLineBreaks()
                .build();
            expect(result).toBe('');
        });
    });
});
