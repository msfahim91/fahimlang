"use strict";

class FahimRuntimeError extends Error {}

// control-flow signals, thrown internally and caught at the right level
class BreakSignal {}
class ContinueSignal {}
class ReturnSignal { constructor(value) { this.value = value; } }

class Environment {
  constructor(parent = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  declare(name, value) {
    this.vars.set(name, value);
  }

  assign(name, value) {
    let env = this;
    while (env) {
      if (env.vars.has(name)) { env.vars.set(name, value); return; }
      env = env.parent;
    }
    throw new FahimRuntimeError(`'${name}' ekhono declare hoyni (ব্যবহারের আগে declare করো 'rakho fahim ${name} = ...;')`);
  }

  get(name) {
    let env = this;
    while (env) {
      if (env.vars.has(name)) return env.vars.get(name);
      env = env.parent;
    }
    throw new FahimRuntimeError(`'${name}' খুঁজে পাওয়া যায়নি (undefined variable/function)`);
  }
}

class FahimFunction {
  constructor(decl, closure) {
    this.decl = decl;
    this.closure = closure;
  }
  call(interp, args) {
    const env = new Environment(this.closure);
    this.decl.params.forEach((p, i) => env.declare(p, args[i] !== undefined ? args[i] : null));
    try {
      interp.execBlock(this.decl.body, env);
    } catch (signal) {
      if (signal instanceof ReturnSignal) return signal.value;
      throw signal;
    }
    return null;
  }
}

function fahimToString(v) {
  if (v === null || v === undefined) return "khali";
  if (v === true) return "sotti";
  if (v === false) return "mittha";
  if (Array.isArray(v)) return "[" + v.map(fahimToString).join(", ") + "]";
  return String(v);
}

// Built-in array methods (Banglish names)
const ARRAY_METHODS = {
  dorghyo: (arr) => arr.length,                                  // length
  jog: (arr, val) => { arr.push(val); return arr.length; },       // push
  bad: (arr) => (arr.length ? arr.pop() : null),                  // pop
  shamne_jog: (arr, val) => { arr.unshift(val); return arr.length; }, // unshift
  shamne_bad: (arr) => (arr.length ? arr.shift() : null),         // shift
  ulto: (arr) => { arr.reverse(); return arr; },                  // reverse
  shamil: (arr, val) => arr.includes(val),                        // includes
  khujo: (arr, val) => arr.indexOf(val),                          // indexOf
  joro: (arr, sep) => arr.map(fahimToString).join(sep !== undefined ? sep : ","), // join
  kat: (arr, start, end) => arr.slice(start, end),                // slice
  shaj: (arr) => { arr.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)); return arr; }, // sort
};

// Built-in string methods (Banglish names)
const STRING_METHODS = {
  dorghyo: (s) => s.length,                       // length
  boro: (s) => s.toUpperCase(),                   // uppercase
  choto: (s) => s.toLowerCase(),                  // lowercase
  trim: (s) => s.trim(),
  kat: (s, start, end) => s.slice(start, end),    // slice
  bhag: (s, sep) => s.split(sep !== undefined ? sep : ""), // split -> array
  shamil: (s, sub) => s.includes(sub),            // includes
  khujo: (s, sub) => s.indexOf(sub),              // indexOf
  bodol: (s, a, b) => s.split(a).join(b),         // replace all
};


function isTruthy(v) {
  if (v === null || v === undefined) return false;
  if (v === false) return false;
  if (v === 0) return false;
  if (v === "") return false;
  return true;
}

class Interpreter {
  constructor({ output = (s) => process.stdout.write(s + "\n") } = {}) {
    this.output = output;
    this.global = new Environment();
  }

  run(program) {
    this.execBlock(program, this.global);
  }

  execBlock(blockNode, env) {
    for (const stmt of blockNode.body) {
      this.execStatement(stmt, env);
    }
  }

  execStatement(node, env) {
    switch (node.type) {
      case "VarDecl":
        env.declare(node.name, this.evalExpr(node.value, env));
        return;
      case "PrintStmt": {
        const parts = node.args.map((a) => fahimToString(this.evalExpr(a, env)));
        this.output(parts.join(" "));
        return;
      }
      case "ExprStmt":
        this.evalExpr(node.expr, env);
        return;
      case "Block": {
        const blockEnv = new Environment(env);
        this.execBlock(node, blockEnv);
        return;
      }
      case "IfStmt": {
        for (const branch of node.branches) {
          if (isTruthy(this.evalExpr(branch.test, env))) {
            this.execStatement(branch.body, new Environment(env));
            return;
          }
        }
        if (node.alternate) this.execStatement(node.alternate, new Environment(env));
        return;
      }
      case "WhileStmt": {
        while (isTruthy(this.evalExpr(node.test, env))) {
          try {
            this.execStatement(node.body, new Environment(env));
          } catch (signal) {
            if (signal instanceof BreakSignal) break;
            if (signal instanceof ContinueSignal) continue;
            throw signal;
          }
        }
        return;
      }
      case "ForStmt": {
        const forEnv = new Environment(env);
        if (node.init) this.execStatement(node.init, forEnv);
        while (node.test === null || isTruthy(this.evalExpr(node.test, forEnv))) {
          try {
            this.execStatement(node.body, new Environment(forEnv));
          } catch (signal) {
            if (signal instanceof BreakSignal) break;
            if (signal instanceof ContinueSignal) {
              if (node.update) this.evalExpr(node.update, forEnv);
              continue;
            }
            throw signal;
          }
          if (node.update) this.evalExpr(node.update, forEnv);
        }
        return;
      }
      case "BreakStmt": throw new BreakSignal();
      case "ContinueStmt": throw new ContinueSignal();
      case "FuncDecl":
        env.declare(node.name, new FahimFunction(node, env));
        return;
      case "ReturnStmt":
        throw new ReturnSignal(node.value ? this.evalExpr(node.value, env) : null);
      default:
        throw new FahimRuntimeError(`Unknown statement type: ${node.type}`);
    }
  }

  evalExpr(node, env) {
    switch (node.type) {
      case "NumberLit": return node.value;
      case "StringLit": return node.value;
      case "BoolLit": return node.value;
      case "NullLit": return null;
      case "ArrayLit": return node.elements.map((el) => this.evalExpr(el, env));
      case "Identifier": return env.get(node.name);
      case "Index": {
        const obj = this.evalExpr(node.object, env);
        const idx = this.evalExpr(node.index, env);
        if (Array.isArray(obj) || typeof obj === "string") {
          const val = obj[idx];
          return val !== undefined ? val : null;
        }
        throw new FahimRuntimeError("Index ([ ]) shudhu array ba string er upore kaj kore");
      }
      case "IndexAssign": {
        const obj = this.evalExpr(node.object, env);
        if (!Array.isArray(obj)) {
          throw new FahimRuntimeError("Index e assign korte hole shei jinish ekta array hote hobe");
        }
        const idx = this.evalExpr(node.index, env);
        let newVal;
        if (node.op === "=") {
          newVal = this.evalExpr(node.value, env);
        } else {
          const current = obj[idx];
          const rhs = this.evalExpr(node.value, env);
          newVal = this.applyBinary(node.op[0], current, rhs);
        }
        obj[idx] = newVal;
        return newVal;
      }
      case "Member":
        throw new FahimRuntimeError(
          `'${node.property}' ekta method — eta call korte hobe, jemon: x.${node.property}()`
        );
      case "Assign": {
        let newVal;
        if (node.op === "=") {
          newVal = this.evalExpr(node.value, env);
        } else {
          const current = env.get(node.name);
          const rhs = this.evalExpr(node.value, env);
          const op = node.op[0]; // '+', '-', '*', '/'
          newVal = this.applyBinary(op, current, rhs);
        }
        env.assign(node.name, newVal);
        return newVal;
      }
      case "Logical": {
        const left = this.evalExpr(node.left, env);
        if (node.op === "&&") return isTruthy(left) ? this.evalExpr(node.right, env) : left;
        return isTruthy(left) ? left : this.evalExpr(node.right, env);
      }
      case "Unary": {
        const v = this.evalExpr(node.operand, env);
        if (node.op === "-") return -v;
        if (node.op === "!") return !isTruthy(v);
        break;
      }
      case "Binary": {
        const left = this.evalExpr(node.left, env);
        const right = this.evalExpr(node.right, env);
        return this.applyBinary(node.op, left, right);
      }
      case "Call": {
        const args = node.args.map((a) => this.evalExpr(a, env));

        if (node.callee.type === "Member") {
          const obj = this.evalExpr(node.callee.object, env);
          return this.callMethod(obj, node.callee.property, args);
        }

        if (node.callee.type !== "Identifier") {
          throw new FahimRuntimeError("Only simple function calls are supported");
        }
        const fn = env.get(node.callee.name);
        if (fn instanceof FahimFunction) return fn.call(this, args);
        if (typeof fn === "function") return fn(...args);
        throw new FahimRuntimeError(`'${node.callee.name}' ekta function na, call kora jabe na`);
      }
      default:
        throw new FahimRuntimeError(`Unknown expression type: ${node.type}`);
    }
  }

  callMethod(obj, methodName, args) {
    if (Array.isArray(obj)) {
      const fn = ARRAY_METHODS[methodName];
      if (!fn) throw new FahimRuntimeError(`Array er '${methodName}' name e kono method nai`);
      return fn(obj, ...args);
    }
    if (typeof obj === "string") {
      const fn = STRING_METHODS[methodName];
      if (!fn) throw new FahimRuntimeError(`String er '${methodName}' name e kono method nai`);
      return fn(obj, ...args);
    }
    throw new FahimRuntimeError(`'${methodName}' method eta ${fahimToString(obj)} er upore use kora jabe na`);
  }

  applyBinary(op, left, right) {
    switch (op) {
      case "+":
        if (typeof left === "string" || typeof right === "string") {
          return fahimToString(left) + fahimToString(right);
        }
        return left + right;
      case "-": return left - right;
      case "*": return left * right;
      case "/": return left / right;
      case "%": return left % right;
      case "==": return left === right;
      case "!=": return left !== right;
      case "<": return left < right;
      case ">": return left > right;
      case "<=": return left <= right;
      case ">=": return left >= right;
      default:
        throw new FahimRuntimeError(`Unknown operator: ${op}`);
    }
  }
}

module.exports = { Interpreter, FahimRuntimeError, fahimToString, ARRAY_METHODS, STRING_METHODS };