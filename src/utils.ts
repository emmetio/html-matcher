import Scanner, { isSpace, isQuote, isAlpha, isNumber, eatPair } from '@emmetio/scanner';

export type FastScanCallback = (name: string, type: ElementType, start: number, end: number) => false | any;

export const enum ElementType {
    Open = 1,
    Close = 2,
    SelfClose = 3
}

export interface SpecialType {
    [tagName: string]: string[] | null;
}

export const enum Chars {
    /** `-` character */
    Dash = 45,
    /** `.` character */
    Dot = 46,
    /** `/` character */
    Slash = 47,
    /** `:` character */
    Colon = 58,
    /** `<` character */
    LeftAngle = 60,
    /** `>` character */
    RightAngle = 62,
    /** `(` character */
    LeftRound = 40,
    /** `)` character */
    RightRound = 41,
    /** `[` character */
    LeftSquare = 91,
    /** `]` character */
    RightSquare = 93,
    /** `{` character */
    LeftCurly = 123,
    /** `}` character */
    RightCurly = 125,
    /** `_` character */
    Underscore = 95,
    /** `=` character */
    Equals = 61,
    /** `*` character */
    Asterisk = 42,
    /** `#` character */
    Hash = 35,
}

export interface ScannerOptions {
    /**
     * Parses given source as XML document. It alters how should-be-empty
     * elements are treated: for example, in XML mode parser will try to locate
     * closing pair for `<br>` tag
     */
    xml: boolean;

    /**
     * List of tags that should have special parsing rules, e.g. should not parse
     * inner content and skip to closing tag. Key is a tag name that should be
     * considered special and value is either empty (always mark element as special)
     * or list of `type` attribute values, which, if present with one of this value,
     * make element special
     */
    special: SpecialType;

    /**
     * List of elements that should be treated as empty (e.g. without closing tag)
     * in non-XML syntax
     */
    empty: string[];
}

const defaultOptions: ScannerOptions = {
    xml: false,
    special: {
        style: null,
        script: ['', 'text/javascript', 'application/x-javascript', 'javascript', 'typescript', 'ts', 'coffee', 'coffeescript']
    },
    empty: ['img', 'meta', 'link', 'br', 'base', 'hr', 'area', 'wbr', 'col', 'embed', 'input', 'param', 'source', 'track']
};

/** Options for `Scanner` utils */
export const opt = { throws: false };

export function createOptions(options: Partial<ScannerOptions> = {}): ScannerOptions {
    return { ...defaultOptions, ...options };
}

/**
 * Converts given string into array of character codes
 */
export function toCharCodes(str: string): number[] {
    return str.split('').map(ch => ch.charCodeAt(0));
}

/**
 * Consumes array of character codes from given scanner
 */
export function consumeArray(scanner: Scanner, codes: number[]): boolean {
    const start = scanner.pos;

    for (let i = 0; i < codes.length; i++) {
        if (!scanner.eat(codes[i])) {
            scanner.pos = start;
            return false;
        }
    }

    scanner.start = start;
    return true;
}

/**
 * Consumes section from given string which starts with `open` character codes
 * and ends with `close` character codes
 * @return Returns `true` if section was consumed
 */
export function consumeSection(scanner: Scanner, open: number[], close: number[], allowUnclosed?: boolean): boolean {
    const start = scanner.pos;
    if (consumeArray(scanner, open)) {
        // consumed `<!--`, read next until we find ending part or reach the end of input
        while (!scanner.eof()) {
            if (consumeArray(scanner, close)) {
                scanner.start = start;
                return true;
            }

            scanner.pos++;
        }

        // unclosed section is allowed
        if (allowUnclosed) {
            scanner.start = start;
            return true;
        }

        scanner.pos = start;
        return false;
    }

    // unable to find section, revert to initial position
    scanner.pos = start;
    return false;
}

/**
 * Check if given character can be used as a start of tag name or attribute
 */
export function nameStartChar(ch: number): boolean {
    // Limited XML spec: https://www.w3.org/TR/xml/#NT-NameStartChar
    return isAlpha(ch) || ch === Chars.Colon || ch === Chars.Underscore
        || (ch >= 0xC0 && ch <= 0xD6)
        || (ch >= 0xD8 && ch <= 0xF6)
        || (ch >= 0xF8 && ch <= 0x2FF)
        || (ch >= 0x370 && ch <= 0x37D)
        || (ch >= 0x37F && ch <= 0x1FFF);
}

/**
 * Check if given character can be used in a tag or attribute name
 */
export function nameChar(ch: number) {
    // Limited XML spec: https://www.w3.org/TR/xml/#NT-NameChar
    return nameStartChar(ch) || ch === Chars.Dash || ch === Chars.Dot || isNumber(ch)
        || ch === 0xB7
        || (ch >= 0x0300 && ch <= 0x036F);
}

/**
 * Consumes identifier from given scanner
 */
export function ident(scanner: Scanner): boolean {
    const start = scanner.pos;
    if (scanner.eat(nameStartChar)) {
        scanner.eatWhile(nameChar);
        scanner.start = start;
        return true;
    }

    return false;
}

/**
 * Check if given code is tag terminator
 */
export function isTerminator(code: number): boolean {
    return code === Chars.RightAngle || code === Chars.Slash;
}

/**
 * Check if given character code is valid unquoted value
 */
export function isUnquoted(code: number): boolean {
    return !isNaN(code) && !isQuote(code) && !isSpace(code) && !isTerminator(code);
}

/**
 * Consumes paired tokens (like `[` and `]`) with respect of nesting and embedded
 * quoted values
 * @return `true` if paired token was consumed
 */
export function consumePaired(scanner: Scanner) {
    return eatPair(scanner, Chars.LeftAngle, Chars.RightAngle, opt)
        || eatPair(scanner, Chars.LeftRound, Chars.RightRound, opt)
        || eatPair(scanner, Chars.LeftSquare, Chars.RightSquare, opt)
        || eatPair(scanner, Chars.LeftCurly, Chars.RightCurly, opt);
}

/**
 * Returns unquoted value of given string
 */
export function getUnquotedValue(value: string): string {
    // Trim quotes
    if (isQuote(value.charCodeAt(0))) {
        value = value.slice(1);
    }

    if (isQuote(value.charCodeAt(value.length - 1))) {
        value = value.slice(0, -1);
    }

    return value;
}
