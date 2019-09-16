import Scanner, { isSpace, eatPair, eatQuoted } from '@emmetio/scanner';
import { ElementType, Chars, consumeArray, toCharCodes, isUnquoted, isTerminator, nameStartChar, nameChar, consumeSection } from './utils';

export type FastScanCallback = (name: string, type: ElementType, start: number, end: number) => false | any;
export { ElementType } from './utils';

const cdataOpen = toCharCodes('<![CDATA[');
const cdataClose = toCharCodes(']]>');
const commentOpen = toCharCodes('<!--');
const commentClose = toCharCodes('-->');
const opt = { throws: true };

/**
 * Performs fast scan of given source code: for each tag found it invokes callback
 * with tag name, its type (open, close, self-close) and range in original source.
 * Unlike regular scanner, fast scanner doesn’t provide info about attribute to
 * reduce object allocations hence increase performance.
 * If `callback` returns false, scanner stops parsing.
 * @param special List of “special” HTML tags which should be ignored. Most likely
 * it’s a "script" and "style" tags.
 */
export default function scan(source: string, callback: FastScanCallback, special?: string[]) {
    const scanner = new Scanner(source);
    let type: ElementType;
    let name: string;
    let nameStart: number;
    let nameEnd: number;
    let nameCodes: number[];
    let found = false;

    while (!scanner.eof()) {
        if (cdata(scanner) || comment(scanner)) {
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

                    if (type === ElementType.Open && special && special.includes(name)) {
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
 * Consumes identifier from given scanner
 */
function ident(scanner: Scanner): boolean {
    if (scanner.eat(nameStartChar)) {
        scanner.eatWhile(nameChar);
        return true;
    }

    return false;
}

/**
 * Skips attribute name from given scanner context
 */
function attributeName(scanner: Scanner): boolean {
    // Attribute name could be a regular name or expression:
    // React-style – <div {...props}>
    // Angular-style – <div [ng-for]>
    return consumePaired(scanner) || ident(scanner);
}

/**
 * Skips attribute value
 */
function attributeValue(scanner: Scanner) {
    // Supported attribute values are quoted, React-like expressions (`{foo}`)
    // or unquoted literals
    return eatQuoted(scanner, opt) || consumePaired(scanner) || scanner.eatWhile(isUnquoted);
}

/**
 * Consumes paired tokens (like `[` and `]`) with respect of nesting and embedded
 * quoted values
 * @return `true` if paired token was consumed
 */
function consumePaired(scanner: Scanner) {
    return eatPair(scanner, Chars.LeftAngle, Chars.RightAngle, opt)
        || eatPair(scanner, Chars.LeftRound, Chars.RightRound, opt)
        || eatPair(scanner, Chars.LeftSquare, Chars.RightSquare, opt)
        || eatPair(scanner, Chars.LeftCurly, Chars.RightCurly, opt);
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
