import Scanner, { isSpace, eatQuoted } from '@emmetio/scanner';
import { FastScanCallback, ElementType, Chars, consumeArray, toCharCodes, isTerminator, consumeSection, ident } from './utils';
import { attributeName, attributeValue } from './attributes';

type SpecialCallback = (name: string, source: string, start: number, end: number) => boolean;

const cdataOpen = toCharCodes('<![CDATA[');
const cdataClose = toCharCodes(']]>');
const commentOpen = toCharCodes('<!--');
const commentClose = toCharCodes('-->');
const piStart = toCharCodes('<?');
const piEnd = toCharCodes('?>');

/**
 * Performs fast scan of given source code: for each tag found it invokes callback
 * with tag name, its type (open, close, self-close) and range in original source.
 * Unlike regular scanner, fast scanner doesn’t provide info about attributes to
 * reduce object allocations hence increase performance.
 * If `callback` returns `false`, scanner stops parsing.
 * @param special List of “special” HTML tags which should be ignored. Most likely
 * it’s a "script" and "style" tags.
 */
export default function scan(source: string, callback: FastScanCallback, special?: SpecialCallback) {
    const scanner = new Scanner(source);
    let type: ElementType;
    let name: string;
    let nameStart: number;
    let nameEnd: number;
    let nameCodes: number[];
    let found = false;

    while (!scanner.eof()) {
        if (cdata(scanner) || comment(scanner) || processingInstruction(scanner)) {
            continue;
        }

        const start = scanner.pos;
        if (scanner.eat(Chars.LeftAngle)) {
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

                    if (type === ElementType.Open && special && special(name, source, start, scanner.pos)) {
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
 * Consumes processing instruction from given scanner
 */
function processingInstruction(scanner: Scanner): boolean {
    if (consumeArray(scanner, piStart)) {
        while (!scanner.eof()) {
            if (consumeArray(scanner, piEnd)) {
                break;
            }

            eatQuoted(scanner) || scanner.pos++;
        }

        return true;
    }

    return false;
}
