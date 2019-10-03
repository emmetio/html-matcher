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

export interface BalancedTag {
    /** Name of balanced tag */
    name: string;
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

    scan(source, (name, type, start, end) => {
        let endOffset = 0;
        if (type === ElementType.Open && isSelfClose(name, options)) {
            // Found empty element in HTML mode, mark is as self-closing
            type = ElementType.SelfClose;
            endOffset = 1;
        }

        if (type === ElementType.Open) {
            // Allocate tag object from pool
            stack.push(allocTag(pool, name, start, end));
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
                    releaseTag(pool, stack.pop()!);
                }
            }
        }
    }, options.special);

    stack.length = pool.length = 0;
    return result;
}

/**
 * Returns balanced tag model: a list of all XML/HTML tags that could possibly match
 * given location when moving in outward direction
 */
export function balancedOutward(source: string, pos: number, opt?: Partial<ScannerOptions>): BalancedTag[] {
    const pool: Tag[] = [];
    const stack: Tag[] = [];
    const options = createOptions(opt);
    const result: BalancedTag[] = [];

    scan(source, (name, type, start, end) => {
        if (type === ElementType.Close) {
            const tag = last(stack);
            if (tag && tag.name === name) { // XXX check for invalid tag names?
                // Matching closing tag found, check if matched pair is a candidate
                // for outward balancing
                if (tag.start < pos && pos < end) {
                    result.push({
                        name,
                        open: [tag.start, tag.end],
                        close: [start, end]
                    });
                }
            }
            // Release tag object for further re-use
            releaseTag(pool, stack.pop()!);
        } else if (type === ElementType.SelfClose || isSelfClose(name, options)) {
            if (start < pos && pos < end) {
                // Matched self-closed tag
                result.push({ name, open: [start, end] });
            }
        } else {
            stack.push(allocTag(pool, name, start, end));
        }
    }, options.special);

    stack.length = pool.length = 0;
    return result;
}

function allocTag(pool: Tag[], name: string, start: number, end: number): Tag {
    if (pool.length) {
        const tag = pool.pop()!;
        tag.name = name;
        tag.start = start;
        tag.end = end;
        return tag;
    }
    return { name, start, end };
}

function releaseTag(pool: Tag[], tag: Tag) {
    pool.push(tag);
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
 * Check if given tag is self-close for current parsing context
 */
function isSelfClose(name: string, options: ScannerOptions) {
    return !options.xml && options.empty.includes(name);
}

function last<T>(arr: T[]): T | null {
    return arr.length ? arr[arr.length - 1] : null;
}
