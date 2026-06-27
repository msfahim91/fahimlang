"use strict";

class ParseError extends Error {}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) { return this.tokens[this.pos + offset]; }
  current() { return this.peek(0); }

  error(msg) {
    const t = this.current();
    throw new ParseError(`Parse error (line ${t.line}): ${msg} (got ${t.type} '${t.value}')`);
  }

  check(type, value = null) {
    const t = this.current();
    if (t.type !== type) return false;
    if (value !== null && t.value !== value) return false;
    return true;
  }

  checkKeyword(word) { return this.check("KEYWORD", word); }

  advance() { return this.tokens[this.pos++]; }

  expect(type, value = null) {
    if (!this.check(type, value)) {
      this.error(`expected ${value ? `'${value}'` : type}`);
    }
    return this.advance();
  }

  expectKeyword(word) { return this.expect("KEYWORD", word); }

  // every action keyword in FahimLang is followed by the joke-suffix "fahim"
  expectKeywordFahim(word) {
    this.expectKeyword(word);
    this.expectKeyword("fahim");
  }

  matchKeywordFahim(word) {
    if (this.checkKeyword(word) && this.peek(1) && this.peek(1).type === "KEYWORD" && this.peek(1).value === "fahim") {
      this.advance();
      this.advance();
      return true;
    }
    return false;
  }

  parseProgram() {
    this.expectKeywordFahim("shuru");
    const statements = [];
    while (!(this.checkKeyword("shesh"))) {
      if (this.check("EOF")) this.error("unexpected end of file, expected 'shesh fahim'");
      statements.push(this.parseStatement());
    }
    this.expectKeywordFahim("shesh");
    return { type: "Program", body: statements };
  }

  parseBlock() {
    this.expect("LBRACE");
    const statements = [];
    while (!this.check("RBRACE")) {
      statements.push(this.parseStatement());
    }
    this.expect("RBRACE");
    return { type: "Block", body: statements };
  }

  parseStatement() {
    if (this.matchKeywordFahim("rakho")) return this.finishVarDecl();
    if (this.matchKeywordFahim("bol")) return this.finishPrint();
    if (this.matchKeywordFahim("jodi")) return this.finishIf();
    if (this.matchKeywordFahim("jotokkhon")) return this.finishWhile();
    if (this.matchKeywordFahim("jonno")) return this.finishFor();
    if (this.matchKeywordFahim("thamo")) { this.expect("SEMI"); return { type: "BreakStmt" }; }
    if (this.matchKeywordFahim("cholo")) { this.expect("SEMI"); return { type: "ContinueStmt" }; }
    if (this.matchKeywordFahim("kaj")) return this.finishFuncDecl();
    if (this.matchKeywordFahim("ferot")) return this.finishReturn();
    if (this.check("LBRACE")) return this.parseBlock();
    return this.finishExprStmt();
  }

  finishVarDecl() {
    const name = this.expect("IDENT").value;
    this.expect("OP", "=");
    const value = this.parseExpression();
    this.expect("SEMI");
    return { type: "VarDecl", name, value };
  }

  finishPrint() {
    const args = [this.parseExpression()];
    while (this.check("COMMA")) { this.advance(); args.push(this.parseExpression()); }
    this.expect("SEMI");
    return { type: "PrintStmt", args };
  }

  finishIf() {
    this.expect("LPAREN");
    const test = this.parseExpression();
    this.expect("RPAREN");
    const consequent = this.parseBlock();
    const branches = [{ test, body: consequent }];
    let alternate = null;

    while (this.matchKeywordFahim("nahoy")) {
      this.expect("LPAREN");
      const t = this.parseExpression();
      this.expect("RPAREN");
      const b = this.parseBlock();
      branches.push({ test: t, body: b });
    }
    if (this.matchKeywordFahim("nahole")) {
      alternate = this.parseBlock();
    }
    return { type: "IfStmt", branches, alternate };
  }

  finishWhile() {
    this.expect("LPAREN");
    const test = this.parseExpression();
    this.expect("RPAREN");
    const body = this.parseBlock();
    return { type: "WhileStmt", test, body };
  }

  // jonno fahim (rakho fahim i = 0; i < 10; i += 1) { ... }
  finishFor() {
    this.expect("LPAREN");

    let init = null;
    if (this.matchKeywordFahim("rakho")) {
      const name = this.expect("IDENT").value;
      this.expect("OP", "=");
      const value = this.parseExpression();
      init = { type: "VarDecl", name, value };
    } else if (!this.check("SEMI")) {
      init = { type: "ExprStmt", expr: this.parseExpression() };
    }
    this.expect("SEMI");

    let test = null;
    if (!this.check("SEMI")) test = this.parseExpression();
    this.expect("SEMI");

    let update = null;
    if (!this.check("RPAREN")) update = this.parseExpression();
    this.expect("RPAREN");

    const body = this.parseBlock();
    return { type: "ForStmt", init, test, update, body };
  }

  finishFuncDecl() {
    const name = this.expect("IDENT").value;
    this.expect("LPAREN");
    const params = [];
    if (!this.check("RPAREN")) {
      params.push(this.expect("IDENT").value);
      while (this.check("COMMA")) { this.advance(); params.push(this.expect("IDENT").value); }
    }
    this.expect("RPAREN");
    const body = this.parseBlock();
    return { type: "FuncDecl", name, params, body };
  }

  finishReturn() {
    let value = null;
    if (!this.check("SEMI")) value = this.parseExpression();
    this.expect("SEMI");
    return { type: "ReturnStmt", value };
  }

  finishExprStmt() {
    const expr = this.parseExpression();
    this.expect("SEMI");
    return { type: "ExprStmt", expr };
  }

  // ---- expressions ----

  parseExpression() { return this.parseAssignment(); }

  parseAssignment() {
    const left = this.parseLogicOr();

    const assignOps = ["=", "+=", "-=", "*=", "/="];
    if (this.check("OP") && assignOps.includes(this.current().value)) {
      const op = this.advance().value;
      const value = this.parseAssignment();

      if (left.type === "Identifier") {
        return { type: "Assign", name: left.name, op, value };
      }
      if (left.type === "Index") {
        return { type: "IndexAssign", object: left.object, index: left.index, op, value };
      }
      this.error("Eta assign kora jay na, left side e shudhu variable ba array[index] hote hobe");
    }
    return left;
  }

  parseLogicOr() {
    let left = this.parseLogicAnd();
    while (this.check("OP", "||")) {
      this.advance();
      const right = this.parseLogicAnd();
      left = { type: "Logical", op: "||", left, right };
    }
    return left;
  }

  parseLogicAnd() {
    let left = this.parseEquality();
    while (this.check("OP", "&&")) {
      this.advance();
      const right = this.parseEquality();
      left = { type: "Logical", op: "&&", left, right };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (this.check("OP", "==") || this.check("OP", "!=")) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { type: "Binary", op, left, right };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseTerm();
    while (["<", ">", "<=", ">="].some((o) => this.check("OP", o))) {
      const op = this.advance().value;
      const right = this.parseTerm();
      left = { type: "Binary", op, left, right };
    }
    return left;
  }

  parseTerm() {
    let left = this.parseFactor();
    while (this.check("PLUS") || this.check("MINUS")) {
      const op = this.advance().value;
      const right = this.parseFactor();
      left = { type: "Binary", op, left, right };
    }
    return left;
  }

  parseFactor() {
    let left = this.parseUnary();
    while (this.check("STAR") || this.check("SLASH") || this.check("PERCENT")) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { type: "Binary", op, left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.check("OP", "!") || this.check("MINUS")) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { type: "Unary", op, operand };
    }
    return this.parseCall();
  }

  parseCall() {
    let expr = this.parsePrimary();
    while (true) {
      if (this.check("LPAREN")) {
        this.advance();
        const args = [];
        if (!this.check("RPAREN")) {
          args.push(this.parseExpression());
          while (this.check("COMMA")) { this.advance(); args.push(this.parseExpression()); }
        }
        this.expect("RPAREN");
        expr = { type: "Call", callee: expr, args };
      } else if (this.check("DOT")) {
        this.advance();
        const property = this.expect("IDENT").value;
        expr = { type: "Member", object: expr, property };
      } else if (this.check("LBRACKET")) {
        this.advance();
        const index = this.parseExpression();
        this.expect("RBRACKET");
        expr = { type: "Index", object: expr, index };
      } else {
        break;
      }
    }
    return expr;
  }

  parsePrimary() {
    const t = this.current();
    if (t.type === "NUMBER") { this.advance(); return { type: "NumberLit", value: t.value }; }
    if (t.type === "STRING") { this.advance(); return { type: "StringLit", value: t.value }; }
    if (t.type === "LITERAL") {
      this.advance();
      if (t.value === "sotti") return { type: "BoolLit", value: true };
      if (t.value === "mittha") return { type: "BoolLit", value: false };
      if (t.value === "khali") return { type: "NullLit" };
    }
    if (t.type === "IDENT") { this.advance(); return { type: "Identifier", name: t.value }; }
    if (t.type === "LBRACKET") {
      this.advance();
      const elements = [];
      if (!this.check("RBRACKET")) {
        elements.push(this.parseExpression());
        while (this.check("COMMA")) { this.advance(); elements.push(this.parseExpression()); }
      }
      this.expect("RBRACKET");
      return { type: "ArrayLit", elements };
    }
    if (t.type === "LPAREN") {
      this.advance();
      const expr = this.parseExpression();
      this.expect("RPAREN");
      return expr;
    }
    this.error("expected an expression");
  }
}

module.exports = { Parser, ParseError };