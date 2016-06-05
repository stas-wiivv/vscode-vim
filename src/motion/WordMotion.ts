import {AbstractMotion} from "./AbstractMotion";
import * as Utils from "../Utils";
import {Position} from "../VimStyle";

export class WordMotion extends AbstractMotion {

    public Direction: Direction;
    // public IsCW: boolean;
    public IsSkipBlankLine: boolean;
    public IsStopLineEnd: boolean;
    public IsWordEnd: boolean;
    public IsWORD: boolean;
    // public IsForRange: boolean;

    constructor(direction: Direction) {
        super();
        this.Direction = direction;
        // this.IsCW = false;
        this.IsSkipBlankLine = false;
        this.IsStopLineEnd = false;
        this.IsWordEnd = false;
        this.IsWORD = false;
        // this.IsForRange = false;
    };

    public CalculateEnd(editor: IEditor, vim: IVimStyle, start: IPosition): IPosition {

        let count = this.Count;

        let previousCharClass: CharGroup = null;
        let charClass: CharGroup = null;
        let nextCharClass: CharGroup = null;

        let previousPosition: Position = null;
        let position: Position = null;
        let nextPosition: Position = editor.GetCurrentPosition();

        let line = editor.ReadLine(nextPosition.Line);
        let lineLength = line.length;
        let documentLength = editor.GetLastLineNum() + 1;

        if (this.Direction === Direction.Right) {
            if (nextPosition.Char === 0) {
                charClass = CharGroup.Spaces;
                nextCharClass = CharGroup.Spaces;
                nextPosition.Char = -1;
                count += 1;
            } else if (nextPosition.Char === 1) {
                nextCharClass = CharGroup.Spaces;
                nextPosition.Char = -1;
            } else {
                nextPosition.Char -= 3;
            }
        } else {
            if (lineLength - 1 === nextPosition.Char) {
                charClass = CharGroup.Spaces;
                nextCharClass = CharGroup.Spaces;
                nextPosition.Char = lineLength;
            } else if (lineLength - 2 === nextPosition.Char) {
                nextCharClass = CharGroup.Spaces;
                nextPosition.Char = lineLength;
            } else {
                nextPosition.Char += 3;
            }
        }

        let isReachLast = false;
        let charCode: number;
        let lineEnd: boolean;
        while (count > -1) {

            lineEnd = false;
            previousPosition = position;
            previousCharClass = charClass;
            position = nextPosition;
            charClass = nextCharClass;
            nextPosition = new Position(position.Line, position.Char);

            // get next charactor

            if (this.Direction === Direction.Left) {

                nextPosition.Char--;
                if (nextPosition.Char < 0) {
                    // First of line
                    nextPosition.Line--;
                    if (nextPosition.Line < 0) {
                        // Fist of document
                        isReachLast = true;
                        break;
                    } else {
                        // before line
                        line = editor.ReadLine(nextPosition.Line);
                        lineLength = line.length;
                        nextPosition.Char = lineLength;
                        nextCharClass = CharGroup.Spaces;
                    }
                } else {
                    // char code
                    let nextCharCode = line.charCodeAt(nextPosition.Char);
                    nextCharClass = Utils.GetCharClass(nextCharCode);
                }

            } else {

                nextPosition.Char++;
                if (lineLength <= nextPosition.Char) {
                    // End of line
                    lineEnd = true;
                    nextPosition.Line++;
                    if (nextPosition.Line === documentLength) {
                        // End of document
                        isReachLast = true;
                        break;
                    } else {
                        // next line
                        line = editor.ReadLine(nextPosition.Line);
                        lineLength = line.length;
                        nextPosition.Char = -1;
                        nextCharClass = CharGroup.Spaces;
                    }
                } else {
                    // char code
                    let nextCharCode = line.charCodeAt(nextPosition.Char);
                    nextCharClass = Utils.GetCharClass(nextCharCode);
                }
            }

            if (previousCharClass === null || charClass === null) {
                continue;
            }

            // handle
            let newWord = false;
            if (charClass !== CharGroup.Spaces) {
                if (this.IsWORD) {
                    if (previousCharClass === CharGroup.Spaces) {
                        newWord = true;
                        count--;
                    }
                } else {
                    if (previousCharClass !== charClass) {
                        newWord = true;
                        count--;
                    }
                }
            } else if (!newWord && !this.IsSkipBlankLine) {
                if (this.Direction === Direction.Right) {
                    if (previousPosition !== null &&
                        previousPosition.Char === -1) {
                        count--;
                    }
                } else {
                    if (nextPosition.Char === -1) {
                        count--;
                    }
                }
            }

            if (count === 0) {
                if (this.IsWordEnd) {
                    if (this.IsWORD) {
                        // E B cW
                        if (nextCharClass === CharGroup.Spaces) {
                            break;
                        }
                        if (lineEnd) {
                            break;
                        }
                    } else {
                        // e b cw
                        if (charClass !== nextCharClass) {
                            break;
                        }
                    }
                } else {
                    // W gE dW yW
                    // e ge dw yw
                    break;
                }
            }
        }

        if (isReachLast) {
            // reach last position
            if (this.Direction === Direction.Left) {
                // top position
                return new Position(0, 0);
            } else {
                // last position
                // if (this.IsForRange) {
                //     position.Char += 1;
                // }
                return position;
            }
        }
        // if (this.IsForRange && previousPosition.Char === -1) {
        //     // Stop end of line
        //     line = editor.ReadLine(previousPosition.Line - 1);
        //     return new Position(previousPosition.Line - 1, line.length);
        // }

        return position;
    }
}