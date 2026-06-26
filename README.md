# FahimLang (.fm)

> একটা toy programming language, [Bhailang](https://bhailang.js.org/) দিয়ে inspired, কিন্তু পুরোটাই Banglish এ — **Fahim** এর নিজের ভাষা! 🎉

লেখা হয়েছে Node.js (JavaScript) দিয়ে। প্রতিটা keyword এর সাথে `fahim` শব্দটা joke-suffix হিসেবে থাকে (ঠিক bhailang এ যেমন সব জায়গায় `bhai` থাকে)।

## ইন্সটল

```bash
npm install -g fahimlang
```

বা রিপো থেকে লোকালি:

```bash
git clone https://github.com/<তোমার-ইউজারনেম>/fahimlang.git
cd fahimlang
npm install
npm link        # এখন "fahim" এবং "fm" কমান্ড গ্লোবালি পাবে
```

## চালানো

```bash
fahim examples/hello.fm
# অথবা
fm examples/hello.fm
```

## Hello World

```fm
shuru fahim
    bol fahim "Hello, FahimLang!";
shesh fahim
```

## ডকুমেন্টেশন

### Entry point

প্রতিটা প্রোগ্রাম শুরু হবে `shuru fahim` দিয়ে আর শেষ হবে `shesh fahim` দিয়ে। বাইরে যা লেখা হবে তা ignore হবে।

```fm
shuru fahim
    // কোড এখানে
shesh fahim
```

### Variables — `rakho fahim`

```fm
shuru fahim
    rakho fahim a = 10;
    rakho fahim naam = "Fahim";
    a = a + 1;
    a += 5;
shesh fahim
```

### Types

```fm
shuru fahim
    rakho fahim x = 10;          // number
    rakho fahim y = "kotha";     // string
    rakho fahim z = sotti;       // true
    rakho fahim w = mittha;      // false
    rakho fahim n = khali;       // null
shesh fahim
```

### Print — `bol fahim`

```fm
shuru fahim
    bol fahim "Hello World";
    bol fahim 5, "ta", sotti, khali;
shesh fahim
```

### শর্ত (if/else-if/else) — `jodi` / `nahoy` / `nahole`

```fm
shuru fahim
    rakho fahim boyosh = 20;

    jodi fahim (boyosh >= 18) {
        bol fahim "Adult";
    } nahoy fahim (boyosh >= 13) {
        bol fahim "Teenager";
    } nahole fahim {
        bol fahim "Shishu";
    }
shesh fahim
```

### লুপ — `jotokkhon fahim`

`thamo fahim;` দিয়ে loop break করো, `cholo fahim;` দিয়ে continue করো।

```fm
shuru fahim
    rakho fahim i = 0;

    jotokkhon fahim (i < 10) {
        i += 1;

        jodi fahim (i == 5) {
            cholo fahim;
        }
        jodi fahim (i == 8) {
            thamo fahim;
        }

        bol fahim "i =", i;
    }
shesh fahim
```

### ফাংশন — `kaj fahim` / `ferot fahim`

```fm
shuru fahim
    kaj fahim factorial(n) {
        jodi fahim (n <= 1) {
            ferot fahim 1;
        }
        ferot fahim n * factorial(n - 1);
    }

    bol fahim "5! =", factorial(5);
shesh fahim
```

### Operators

| ধরন | অপারেটর |
|---|---|
| Arithmetic | `+ - * / %` |
| Comparison | `== != < > <= >=` |
| Logical | `&& \|\| !` |
| Assignment | `= += -= *= /=` |

### Comments

```fm
// এটা একটা comment
```

## Keyword cheat-sheet

| FahimLang | মানে |
|---|---|
| `shuru fahim` ... `shesh fahim` | program start/end |
| `rakho fahim` | variable declare |
| `bol fahim` | print |
| `jodi fahim` / `nahoy fahim` / `nahole fahim` | if / else-if / else |
| `jotokkhon fahim` | while |
| `thamo fahim` | break |
| `cholo fahim` | continue |
| `kaj fahim` | function declare |
| `ferot fahim` | return |
| `sotti` / `mittha` / `khali` | true / false / null |

## প্রোজেক্ট স্ট্রাকচার

```
fahimlang/
├── bin/fahim.js        # CLI entry point
├── src/
│   ├── lexer.js        # tokenizer
│   ├── parser.js       # recursive-descent parser -> AST
│   ├── interpreter.js  # tree-walking interpreter
│   └── index.js        # public API (run())
├── examples/           # .fm sample programs
├── package.json
└── README.md
```

## Programmatic ব্যবহার

```js
const { run } = require("fahimlang");
run(`
shuru fahim
    bol fahim "Hi from code!";
shesh fahim
`);
```

## License

MIT
