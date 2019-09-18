import Scanner, { eatQuoted, isSpace } from '@emmetio/scanner';
import { Chars, ident, consumePaired, opt, isUnquoted, getUnquotedValue } from './utils';

export interface AttributeToken {
    name: string;
    value?: string;
    nameStart: number;
    nameEnd: number;
    valueStart?: number;
    valueEnd?: number;
}

/**
 * Parses given string as list of HTML attributes.
 * @param src A fragment between element name and tag closing angle.
 * E.g., for `<a foo="bar">` tag it must be ` foo="bar"`
 */
export default function attributes(src: string): AttributeToken[] {
    const result: AttributeToken[] = [];
    const scanner = new Scanner(src);

    while (!scanner.eof()) {
        scanner.eatWhile(isSpace);
        if (attributeName(scanner)) {
            const token: AttributeToken = {
                name: scanner.current(),
                nameStart: scanner.start,
                nameEnd: scanner.pos
            };

            if (scanner.eat(Chars.Equals) && attributeValue(scanner)) {
                token.value = scanner.current();
                token.valueStart = scanner.start;
                token.valueEnd = scanner.pos;
            }

            result.push(token);
        } else {
            // Do not break on invalid attributes: we are not validating parser
            scanner.pos++;
        }
    }

    return result;
}

/**
 * Consumes attribute name from given scanner context
 */
export function attributeName(scanner: Scanner): boolean {
    const start = scanner.pos;
    if (scanner.eat(Chars.Asterisk) || scanner.eat(Chars.Hash)) {
        // Angular-style directives: `<section *ngIf="showSection">`, `<video #movieplayer ...>`
        ident(scanner);
        scanner.start = start;
        return true;
    }

    // Attribute name could be a regular name or expression:
    // React-style – `<div {...props}>`
    // Angular-style – `<div [ng-for]>` or `<div *ng-for>`
    return consumePaired(scanner) || ident(scanner);
}

/**
 * Consumes attribute value
 */
export function attributeValue(scanner: Scanner) {
    // Supported attribute values are quoted, React-like expressions (`{foo}`)
    // or unquoted literals
    return eatQuoted(scanner, opt) || consumePaired(scanner) || unquoted(scanner);
}

/**
 * Returns clean (unquoted) value of `name` attribute
 */
export function getAttributeValue(attrs: AttributeToken[], name: string): string | undefined {
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (attr.name === name) {
            return attr.value && getUnquotedValue(attr.value);
        }
    }
}

/**
 * Consumes unquoted value
 */
function unquoted(scanner: Scanner) {
    const start = scanner.pos;
    if (scanner.eatWhile(isUnquoted)) {
        scanner.start = start;
        return true;
    }
}
