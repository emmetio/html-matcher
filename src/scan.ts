import Scanner, { isSpace, eatQuoted } from '@emmetio/scanner';
import { FastScanCallback, ElementType, Chars, consumeArray, toCharCodes, isTerminator, consumeSection, ident, SpecialType, ScannerOptions } from './utils';
import attributes, { attributeName, attributeValue, getAttributeValue } from './attributes';

const cdataOpen = toCharCodes('<![CDATA[');
const cdataClose = toCharCodes(']]>');
const commentOpen = toCharCodes('<!--');
const commentClose = toCharCodes('-->');
const piStart = toCharCodes('<?');
const piEnd = toCharCodes('?>');
const erbStart = toCharCodes('<%');
const erbEnd = toCharCodes('%>');

/**
 * Performs fast scan of given source code: for each tag found it invokes callback
 * with tag name, its type (open, close, self-close) and range in original source.
 * Unlike regular scanner, fast scanner doesn’t provide info about attributes to
 * reduce object allocations hence increase performance.
 * If `callback` returns `false`, scanner stops parsing.
 * @param special List of “special” HTML tags which should be ignored. Most likely
 * it’s a "script" and "style" tags.
 */
export default function scan(source: string, callback: FastScanCallback, options?: ScannerOptions) {
    const scanner = new Scanner(source);
    const special = options ? options.special : null;
    const allTokens = options ? options.allTokens : false;
    let type: ElementType;
    let name: string;
    let nameStart: number;
    let nameEnd: number;
    let nameCodes: number[];
    let found = false;
    let piName: string | null = null;

    while (!scanner.eof()) {
        const start = scanner.pos;

        if (cdata(scanner)) {
            if (allTokens && callback('#cdata', ElementType.CData, scanner.start, scanner.pos) === false) {
                break;
            }
        } else if (comment(scanner)) {
            if (allTokens && callback('#comment', ElementType.Comment, scanner.start, scanner.pos) === false) {
                break;
            }
        } else if (erb(scanner)) {
            if (allTokens && callback('#erb', ElementType.ERB, scanner.start, scanner.pos) === false) {
                break;
            }
        } else if (piName = processingInstruction(scanner)) {
            if (allTokens && callback(piName, ElementType.ProcessingInstruction, scanner.start, scanner.pos) === false) {
                break;
            }
        } else if (scanner.eat(Chars.LeftAngle)) {
            // Maybe a tag name?
            type = scanner.eat(Chars.Slash) ? ElementType.Close : ElementType.Open;
            nameStart = scanner.pos;

            if (ident(scanner)) {
                // Consumed tag name
                nameEnd = scanner.pos;
                if (type !== ElementType.Close) {
                    skipAttributes(scanner);
                    scanner.eatWhile(isSpace);
                    if (scanner.eat(Chars.Slash)) {
                        type = ElementType.SelfClose;
                    }
                }

                if (scanner.eat(Chars.RightAngle)) {
                    // Tag properly closed
                    name = scanner.substring(nameStart, nameEnd);
                    if (callback(name, type, start, scanner.pos) === false) {
                        break;
                    }

                    if (type === ElementType.Open && special && isSpecial(special, name, source, start, scanner.pos)) {
                        // Found opening tag of special element: we should skip
                        // scanner contents until we find closing tag
                        nameCodes = toCharCodes(name);
                        found = false;
                        while (!scanner.eof()) {
                            if (consumeClosing(scanner, nameCodes)) {
                                found = true;
                                break;
                            }

                            scanner.pos++;
                        }

                        if (found && callback(name, ElementType.Close, scanner.start, scanner.pos) === false) {
                            break;
                        }
                    }
                }
            }
        } else {
            scanner.pos++;
        }
    }
}

/**
 * Skips attributes in current tag context
 */
function skipAttributes(scanner: Scanner) {
    while (!scanner.eof()) {
        scanner.eatWhile(isSpace);
        if (attributeName(scanner)) {
            if (scanner.eat(Chars.Equals)) {
                attributeValue(scanner);
            }
        } else if (isTerminator(scanner.peek())) {
            break;
        } else {
            scanner.pos++;
        }
    }
}

/**
 * Consumes closing tag with given name from scanner
 */
function consumeClosing(scanner: Scanner, name: number[]): boolean {
    const start = scanner.pos;
    if (scanner.eat(Chars.LeftAngle) && scanner.eat(Chars.Slash) && consumeArray(scanner, name) && scanner.eat(Chars.RightAngle)) {
        scanner.start = start;
        return true;
    }

    scanner.pos = start;
    return false;
}

/**
 * Consumes CDATA from given scanner
 */
function cdata(scanner: Scanner): boolean {
    return consumeSection(scanner, cdataOpen, cdataClose, true);
}

/**
 * Consumes comments from given scanner
 */
function comment(scanner: Scanner): boolean {
    return consumeSection(scanner, commentOpen, commentClose, true);
}

/**
 * Consumes processing instruction from given scanner. If consumed, returns
 * processing instruction name
 */
function processingInstruction(scanner: Scanner): string | null {
    const start = scanner.pos;
    if (consumeArray(scanner, piStart) && ident(scanner)) {
        const name = scanner.current();
        while (!scanner.eof()) {
            if (consumeArray(scanner, piEnd)) {
                break;
            }

            eatQuoted(scanner) || scanner.pos++;
        }

        scanner.start = start;
        return name;
    }

    scanner.pos = start;
    return null;
}

/**
 * Consumes ERB-style entity: `<% ... %>` or `<%= ... %>`
 */
function erb(scanner: Scanner): boolean {
    const start = scanner.pos;
    if (consumeArray(scanner, erbStart)) {
        while (!scanner.eof()) {
            if (consumeArray(scanner, erbEnd)) {
                break;
            }

            eatQuoted(scanner) || scanner.pos++;
        }

        scanner.start = start;
        return true;
    }

    scanner.pos = start;
    return false;
}

/**
 * Check if given tag name should be considered as special
 */
function isSpecial(special: SpecialType, name: string, source: string, start: number, end: number): boolean {
    if (name in special) {
        const typeValues = special[name];
        if (!Array.isArray(typeValues)) {
            return true;
        }

        const attrs = attributes(source.substring(start + name.length + 1, end - 1));
        return typeValues.includes(getAttributeValue(attrs, 'type') || '');
    }

    return false;
}
