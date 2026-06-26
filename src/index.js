"use strict";

const { Lexer } = require("./lexer");
const { Parser } = require("./parser");
const { Interpreter } = require("./interpreter");

function run(source, options = {}) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens);
  const program = parser.parseProgram();

  const interpreter = new Interpreter(options);
  interpreter.run(program);
}

module.exports = { run, Lexer, Parser, Interpreter };
