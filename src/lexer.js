"use strict";

// All keywords end with "fahim" in FahimLang (the inside-joke flavor),
// except literal values (sotti/mittha/khali) which are values, not actions.
const KEYWORD_WORDS = new Set([
  "shuru", "shesh",      // start / end
  "rakho",                // declare variable
  "bol",                  // print
  "jodi", "nahoy", "nahole", // if / else if / else
  "jotokkhon",             // while
  "thamo",                 // break
  "cholo",                 // continue
  "kaj",                   // function
  "ferot",                  // return
  "fahim",                  // joke-suffix token
]);

const LITERAL_WORDS = new Set(["sotti", "mittha", "khali"]);

const SINGLE_CHAR_TOKENS = {
  "(": "LPAREN", ")": "RPAREN",
  "{": "LBRACE", "}": "RBRACE",
  ";": "SEMI", ",": "COMMA",
  "+": "PLUS", "-": "MINUS", "*": "STAR", "/": "SLASH", "%": "PERCENT",
};

function isDigit(ch) { return ch >= "0" && ch <= "9"; }
function isAlpha(ch) { return /[A-Za-z_]/.test(ch); }
function isAlphaNum(ch) { return /[A-Za-z0-9_]/.test(ch); }

class Lexer {
  constructor(source) {
    this.src = source;
    this.pos = 0;
    this.line = 1;
    this.tokens = [];
  }

  peekChar(offset = 0) { return this.src[this.pos + offset]; }

  error(msg) {
    throw new SyntaxError(`Lexer error (line ${this.line}): ${msg}`);
  }

  tokenize() {
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];

      if (ch === "\n") { this.line++; this.pos++; continue; }
      if (/\s/.test(ch)) { this.pos++; continue; }

      // comments
      if (ch === "/" && this.peekChar(1) === "/") {
        while (this.pos < this.src.length && this.src[this.pos] !== "\n") this.pos++;
        continue;
      }

      // strings
      if (ch === '"' || ch === "'") {
        this.tokens.push(this.readString(ch));
        continue;
      }

      // numbers
      if (isDigit(ch)) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // identifiers / keywords / literals
      if (isAlpha(ch)) {
        this.tokens.push(this.readWord());
        continue;
      }

      // two-char operators
      const two = this.src.substr(this.pos, 2);
      if (["==", "!=", "<=", ">=", "&&", "||", "+=", "-=", "*=", "/="].includes(two)) {
        this.tokens.push({ type: "OP", value: two, line: this.line });
        this.pos += 2;
        continue;
      }

      if (ch === "=") { this.tokens.push({ type: "OP", value: "=", line: this.line }); this.pos++; continue; }
      if (ch === "<") { this.tokens.push({ type: "OP", value: "<", line: this.line }); this.pos++; continue; }
      if (ch === ">") { this.tokens.push({ type: "OP", value: ">", line: this.line }); this.pos++; continue; }
      if (ch === "!") { this.tokens.push({ type: "OP", value: "!", line: this.line }); this.pos++; continue; }

      if (SINGLE_CHAR_TOKENS[ch]) {
        this.tokens.push({ type: SINGLE_CHAR_TOKENS[ch], value: ch, line: this.line });
        this.pos++;
        continue;
      }

      this.error(`Unexpected character '${ch}'`);
    }
    this.tokens.push({ type: "EOF", value: null, line: this.line });
    return this.tokens;
  }

  readString(quote) {
    const startLine = this.line;
    this.pos++; // skip opening quote
    let value = "";
    while (this.pos < this.src.length && this.src[this.pos] !== quote) {
      let ch = this.src[this.pos];
      if (ch === "\\") {
        this.pos++;
        const next = this.src[this.pos];
        if (next === "n") value += "\n";
        else if (next === "t") value += "\t";
        else value += next;
        this.pos++;
      } else {
        if (ch === "\n") this.line++;
        value += ch;
        this.pos++;
      }
    }
    if (this.src[this.pos] !== quote) this.error("Unterminated string literal");
    this.pos++; // skip closing quote
    return { type: "STRING", value, line: startLine };
  }

  readNumber() {
    const start = this.pos;
    while (isDigit(this.peekChar())) this.pos++;
    if (this.peekChar() === "." && isDigit(this.peekChar(1))) {
      this.pos++;
      while (isDigit(this.peekChar())) this.pos++;
    }
    const text = this.src.slice(start, this.pos);
    return { type: "NUMBER", value: parseFloat(text), line: this.line };
  }

  readWord() {
    const start = this.pos;
    while (this.pos < this.src.length && isAlphaNum(this.peekChar())) this.pos++;
    const text = this.src.slice(start, this.pos);

    if (KEYWORD_WORDS.has(text)) {
      return { type: "KEYWORD", value: text, line: this.line };
    }
    if (LITERAL_WORDS.has(text)) {
      return { type: "LITERAL", value: text, line: this.line };
    }
    return { type: "IDENT", value: text, line: this.line };
  }
}

module.exports = { Lexer };
