import { isQuote } from '@emmetio/scanner';
import { ScannerOptions, ElementType, createOptions } from './utils';
import scan from './scan';
import attributes, { AttributeToken } from './attributes';

export { scan, attributes };
export { createOptions, ScannerOptions, ElementType, FastScanCallback } from './utils';

export interface MatchedTag {
    /** Name of matched tag */
    name: string;
    /** List of tag attributes */
    attributes: AttributeToken[];
    /** Range of opening tag */
    open: [number, number];
    /** Range of closing tag. If absent, tag is self-closing */
    close?: [number, number];
}

interface Tag {
    name: string;
    start: number;
    end: number;
}

/**
 * Finds matched tag for given `pos` location in XML/HTML `source`
 */
export default function match(source: string, pos: number, opt?: Partial<ScannerOptions>): MatchedTag | null {
    // Since we expect large input document, we’ll use pooling technique
    // for storing tag data to reduce memory pressure and improve performance
    const pool: Tag[] = [];
    const stack: Tag[] = [];
    const options = createOptions(opt);
    let result: MatchedTag | null = null;

    // Check if given tag is special
    const special = isSpecial(options);

    scan(source, (name, type, start, end) => {
        let endOffset = 0;
        if (type === ElementType.Open && !options.xml && options.empty.includes(name)) {
            // Found empty element in HTML mode, mark is as self-closing
            type = ElementType.SelfClose;
            endOffset = 1;
        }

        if (type === ElementType.Open) {
            // Allocate tag object from pool
            const tag = pool.length ? pool.pop()! : { name: '', start: 0, end: 0 };
            tag.name = name;
            tag.start = start;
            tag.end = end;
            stack.push(tag);
        } else if (type === ElementType.SelfClose) {
            if (start < pos && pos < end) {
                // Matched given self-closing tag
                result = {
                    name,
                    attributes: getAttributes(source, start + name.length + 1, end - 2 + endOffset),
                    open: [start, end]
                };
                return false;
            }
        } else {
            const tag = last(stack);
            if (tag && tag.name === name) {
                // Matching closing tag found
                if (tag.start < pos && pos < end) {
                    result = {
                        name,
                        attributes: getAttributes(source, tag.start + name.length + 1, tag.end - 1),
                        open: [tag.start, tag.end],
                        close: [start, end]
                    };
                    return false;
                } else if (stack.length) {
                    // Release tag object for further re-use
                    pool.push(stack.pop()!);
                }
            }
        }
    }, special);

    stack.length = pool.length = 0;
    return result;
}

/**
 * Creates function that check if given element is special
 */
export function isSpecial(options: ScannerOptions) {
    return (name: string, src: string, start: number, end: number) => {
        if (options.special.includes(name)) {
            const attrs = getAttributes(src, start + name.length + 1, end - 1);
            const value = getAttributeValue(attrs, 'type');
            return !options.nonSpecialType.includes(value || '');
        }

        return false;
    };
}

/**
 * Returns parsed attributes from given source
 */
function getAttributes(source: string, start: number, end: number): AttributeToken[] {
    const tokens = attributes(source.slice(start, end));
    tokens.forEach(attr => {
        attr.nameStart += start;
        attr.nameEnd += start;
        if (attr.value != null) {
            attr.valueStart! += start;
            attr.valueEnd! += start;
        }
    });

    return tokens;
}

/**
 * Returns clean (unquoted) value of `name` attribute
 */
function getAttributeValue(attrs: AttributeToken[], name: string): string | undefined {
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (attr.name === name) {
            let value = attr.value;
            if (value) {
                // Trim quotes
                if (isQuote(value.charCodeAt(0))) {
                    value = value.slice(1);
                }

                if (isQuote(value.charCodeAt(value.length - 1))) {
                    value = value.slice(0, -1);
                }
            }
            return value;
        }
    }
}

function last<T>(arr: T[]): T | null {
    return arr.length ? arr[arr.length - 1] : null;
}
