'use strict';
 

/**
 * 今天我们将一起编写一个编译器。但不是普通的编译器... 是一个超级超级迷你的编译器！
 * 这个编译器非常小，如果删除所有注释，这个文件只有大约 200 行的实际代码。
 *
 * 我们将把一些类似 lisp 的函数调用编译成一些类似 C 的函数调用。
 *
 * 如果你对其中一种或另一种不熟悉，我会给你一个快速介绍。
 *
 * 如果我们有两个函数 `add` 和 `subtract`，它们会这样写：
 *
 *                  LISP                      C
 *
 *   2 + 2          (add 2 2)                 add(2, 2)
 *   4 - 2          (subtract 4 2)            subtract(4, 2)
 *   2 + (4 - 2)    (add 2 (subtract 4 2))    add(2, subtract(4, 2))
 *
 * 很简单对吧？
 *
 * 很好，因为这正是我们要编译的东西。虽然这既不是完整的 LISP 也不是 C 语法，
 * 但它足以演示现代编译器的许多主要部分。
 */

/**
 * 大多数编译器分为三个主要阶段：解析（Parsing）、转换（Transformation）和代码生成（Code Generation）
 *
 * 1. *解析* 是将原始代码转换为更抽象的代码表示形式。
 *
 * 2. *转换* 获取这个抽象表示并对其进行操作，以完成编译器想要它做的任何事情。
 *
 * 3. *代码生成* 获取转换后的代码表示并将其转换为新代码。
 */

/**
 * 解析（Parsing）
 * -------
 *
 * 解析通常分为两个阶段：词法分析和语法分析。
 *
 * 1. *词法分析* 获取原始代码，并通过一个叫做分词器（tokenizer）（或词法分析器 lexer）
 *    的东西将其分割成这些叫做 tokens（词法单元）的东西。
 *
 *    Tokens 是一个由微小对象组成的数组，这些对象描述了语法的一个独立部分。
 *    它们可以是数字、标签、标点符号、运算符，等等。
 *
 * 2. *语法分析* 获取 tokens 并将它们重新格式化为一种表示形式，该表示形式描述了
 *    语法的每个部分及其相互关系。这被称为中间表示或抽象语法树。
 *
 *    抽象语法树，简称 AST，是一个深度嵌套的对象，它以一种既易于使用又能告诉我们
 *    很多信息的方式表示代码。
 *
 * 对于以下语法：
 *
 *   (add 2 (subtract 4 2))
 *
 * Tokens 可能看起来像这样：
 *
 *   [
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'add'      },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'subtract' },
 *     { type: 'number', value: '4'        },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: ')'        },
 *     { type: 'paren',  value: ')'        },
 *   ]
 *
 * 抽象语法树（AST）可能看起来像这样：
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2',
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4',
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2',
 *         }]
 *       }]
 *     }]
 *   }
 */

/**
 * 转换（Transformation）
 * --------------
 *
 * 编译器的下一个阶段类型是转换。同样，这只是从最后一步获取 AST 并对其进行更改。
 * 它可以用相同的语言操作 AST，也可以将其翻译成全新的语言。
 *
 * 让我们看看我们如何转换一个 AST。
 *
 * 你可能会注意到我们的 AST 中的元素看起来非常相似。有这些带有 type 属性的对象。
 * 这些中的每一个都被称为 AST 节点。这些节点上定义了描述树的一个独立部分的属性。
 *
 * 我们可以有一个 "NumberLiteral" 的节点：
 *
 *   {
 *     type: 'NumberLiteral',
 *     value: '2',
 *   }
 *
 * 或者也许是一个 "CallExpression" 的节点：
 *
 *   {
 *     type: 'CallExpression',
 *     name: 'subtract',
 *     params: [...嵌套的节点放在这里...],
 *   }
 *
 * 在转换 AST 时，我们可以通过添加/删除/替换属性来操作节点，我们可以添加新节点，
 * 删除节点，或者我们可以让现有的 AST 保持不变，并基于它创建一个全新的 AST。
 *
 * 由于我们的目标是一种新语言，我们将专注于创建一个特定于目标语言的全新 AST。
 *
 * 遍历（Traversal）
 * ---------
 *
 * 为了能够浏览所有这些节点，我们需要能够遍历它们。这个遍历过程以深度优先的方式
 * 访问 AST 中的每个节点。
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2'
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4'
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2'
 *         }]
 *       }]
 *     }]
 *   }
 *
 * 所以对于上面的 AST，我们会：
 *
 *   1. Program - 从 AST 的顶层开始
 *   2. CallExpression (add) - 移动到 Program 的 body 的第一个元素
 *   3. NumberLiteral (2) - 移动到 CallExpression 的 params 的第一个元素
 *   4. CallExpression (subtract) - 移动到 CallExpression 的 params 的第二个元素
 *   5. NumberLiteral (4) - 移动到 CallExpression 的 params 的第一个元素
 *   6. NumberLiteral (2) - 移动到 CallExpression 的 params 的第二个元素
 *
 * 如果我们直接操作这个 AST，而不是创建一个单独的 AST，我们可能会在这里引入各种抽象。
 * 但只是访问树中的每个节点对于我们想要做的事情来说就足够了。
 *
 * 我使用"访问"这个词的原因是因为有一种模式可以表示对象结构元素的操作。
 *
 * 访问者（Visitors）
 * --------
 *
 * 这里的基本思想是我们将创建一个"访问者"对象，该对象具有接受不同节点类型的方法。
 *
 *   var visitor = {
 *     NumberLiteral() {},
 *     CallExpression() {},
 *   };
 *
 * 当我们遍历 AST 时，每当我们"进入"一个匹配类型的节点时，我们将调用这个访问者上的方法。
 *
 * 为了使这有用，我们还将传递节点和对父节点的引用。
 *
 *   var visitor = {
 *     NumberLiteral(node, parent) {},
 *     CallExpression(node, parent) {},
 *   };
 *
 * 但是，还存在在"退出"时调用事物的可能性。想象一下我们之前的树结构的列表形式：
 *
 *   - Program
 *     - CallExpression
 *       - NumberLiteral
 *       - CallExpression
 *         - NumberLiteral
 *         - NumberLiteral
 *
 * 当我们向下遍历时，我们将到达死胡同的分支。当我们完成树的每个分支时，我们"退出"它。
 * 所以向下遍历树时我们"进入"每个节点，向上返回时我们"退出"。
 *
 *   -> Program (进入)
 *     -> CallExpression (进入)
 *       -> Number Literal (进入)
 *       <- Number Literal (退出)
 *       -> Call Expression (进入)
 *          -> Number Literal (进入)
 *          <- Number Literal (退出)
 *          -> Number Literal (进入)
 *          <- Number Literal (退出)
 *       <- CallExpression (退出)
 *     <- CallExpression (退出)
 *   <- Program (退出)
 *
 * 为了支持这一点，我们访问者的最终形式将如下所示：
 *
 *   var visitor = {
 *     NumberLiteral: {
 *       enter(node, parent) {},
 *       exit(node, parent) {},
 *     }
 *   };
 */

/**
 * 代码生成（Code Generation）
 * ---------------
 *
 * 编译器的最后阶段是代码生成。有时编译器会做与转换重叠的事情，但在大多数情况下，
 * 代码生成只是意味着获取我们的 AST 并将代码字符串化输出。
 *
 * 代码生成器以几种不同的方式工作，一些编译器会重用早期的 tokens，其他编译器会
 * 创建代码的单独表示，以便它们可以线性打印节点，但据我所知，大多数编译器会使用
 * 我们刚刚创建的同一个 AST，这就是我们要关注的。
 *
 * 实际上，我们的代码生成器将知道如何"打印" AST 的所有不同节点类型，它将递归调用
 * 自身来打印嵌套节点，直到所有内容都被打印成一个长代码字符串。
 */

/**
 * 就是这样！这就是编译器的所有不同部分。
 *
 * 现在这并不是说每个编译器看起来都和我在这里描述的一样。编译器有许多不同的用途，
 * 它们可能需要比我详细描述的更多的步骤。
 *
 * 但现在你应该对大多数编译器的样子有了一个大致的高层次的了解。
 *
 * 既然我已经解释了所有这些，你们都可以去编写自己的编译器了，对吧？
 *
 * 开玩笑的，这就是我来帮忙的原因 :P
 *
 * 那么让我们开始吧...
 */

/**
 * ============================================================================
 *                                   (/^▽^)/
 *                                分词器（THE TOKENIZER）!
 * ============================================================================
 */

/**
 * 我们将从解析的第一阶段开始，即使用分词器进行词法分析。
 *
 * 我们只是要获取我们的代码字符串并将其分解为一个 tokens 数组。
 *
 *   (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 */

// 我们首先接受一个输入的代码字符串，然后我们要设置两样东西...
function tokenizer(input) {

  // 一个 `current` 变量用于跟踪我们在代码中的位置，就像一个光标。
  let current = 0;

  // 还有一个 `tokens` 数组用于将我们的 tokens 推入。
  let tokens = [];

  // 我们首先创建一个 `while` 循环，在循环`内部`我们可以根据需要多次增加 `current` 变量。
  //
  // 我们这样做是因为我们可能希望在单个循环中多次增加 `current`，因为我们的 tokens 可以是任意长度。
  while (current < input.length) {

    // 我们还要在 `input` 中存储 `current` 字符。
    let char = input[current];

    // 我们要检查的第一件事是一个左括号。这将在以后用于 `CallExpression`，
    // 但现在我们只关心字符。
    //
    // 我们检查是否有一个左括号：
    if (char === '(') {

      // 如果有，我们推入一个新的 token，类型为 `paren`，值设置为左括号。
      tokens.push({
        type: 'paren',
        value: '(',
      });

      // 然后我们增加 `current`
      current++;

      // 然后我们 `continue` 到循环的下一个周期。
      continue;
    }

    // 接下来我们要检查一个右括号。我们做完全相同的事情：检查右括号，添加一个新 token，
    // 增加 `current`，然后 `continue`。
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }

    // 继续前进，我们现在要检查空白字符。这很有趣，因为我们关心空白字符的存在以分隔字符，
    // 但它对我们来说实际上并不重要作为一个 token 来存储。我们以后只会把它扔掉。
    //
    // 所以在这里我们只是要测试是否存在，如果存在，我们就继续。
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // 下一个 token 类型是数字。这与我们之前看到的不同，因为数字可以是任意数量的字符，
    // 我们希望将整个字符序列捕获为一个 token。
    //
    //   (add 123 456)
    //        ^^^ ^^^
    //        只有两个单独的 tokens
    //
    // 所以当我们遇到序列中的第一个数字时，我们就开始这个过程。
    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {

      // 我们要创建一个 `value` 字符串，我们将向其推入字符。
      let value = '';

      // 然后我们将循环遍历序列中的每个字符，直到我们遇到一个不是数字的字符，
      // 将每个是数字的字符推入我们的 `value`，并在过程中增加 `current`。
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // 之后，我们将我们的 `number` token 推入 `tokens` 数组。
      tokens.push({ type: 'number', value });

      // 然后我们继续。
      continue;
    }

    // 我们还将在我们的语言中添加对字符串的支持，字符串是由双引号 (") 包围的任何文本。
    //
    //   (concat "foo" "bar")
    //            ^^^   ^^^ 字符串 tokens
    //
    // 我们首先检查开头的引号：
    if (char === '"') {
      // 保留一个 `value` 变量来构建我们的字符串 token。
      let value = '';

      // 我们将在 token 中跳过开头的双引号。
      char = input[++current];

      // 然后我们将遍历每个字符，直到我们到达另一个双引号。
      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      // 跳过结尾的双引号。
      char = input[++current];

      // 并将我们的 `string` token 添加到 `tokens` 数组。
      tokens.push({ type: 'string', value });

      continue;
    }

    // 最后一种 token 类型将是 `name` token。这是一个字母序列而不是数字，
    // 是我们 lisp 语法中函数的名称。
    //
    //   (add 2 4)
    //    ^^^
    //    Name token
    //
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';

      // 同样，我们只是要循环遍历所有字母，将它们推入一个值。
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // 并将该值作为 token 推入，类型为 `name`，然后继续。
      tokens.push({ type: 'name', value });

      continue;
    }

    // 最后，如果到现在我们还没有匹配到一个字符，我们将抛出一个错误并完全退出。
    throw new TypeError('I dont know what this character is: ' + char);
  }

  // 然后在我们的 `tokenizer` 的最后，我们简单地返回 tokens 数组。
  return tokens;
}

/**
 * ============================================================================
 *                                 ヽ/❀o ل͜ o\ﾉ
 *                                解析器（THE PARSER）!!!
 * ============================================================================
 */

/**
 * 对于我们的解析器，我们将获取我们的 tokens 数组并将其转换为 AST。
 *
 *   [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */

// 好的，所以我们定义一个 `parser` 函数，它接受我们的 `tokens` 数组。
function parser(tokens) {

  // 同样，我们保留一个 `current` 变量，我们将用它作为光标。
  let current = 0;

  // 但这次我们要使用递归而不是 `while` 循环。所以我们定义一个 `walk` 函数。
  function walk() {

    // 在 walk 函数内部，我们首先获取 `current` token。
    let token = tokens[current];

    // 我们将把每种类型的 token 分成不同的代码路径，从 `number` tokens 开始。
    //
    // 我们测试看看我们是否有一个 `number` token。
    if (token.type === 'number') {

      // 如果有，我们将增加 `current`。
      current++;

      // 我们将返回一个名为 `NumberLiteral` 的新 AST 节点，并将其值设置为我们 token 的值。
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // 如果我们有一个字符串，我们将做与数字相同的事情并创建一个 `StringLiteral` 节点。
    if (token.type === 'string') {
      current++;

      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // 接下来我们要寻找 CallExpressions。当我们遇到一个左括号时，我们开始这个过程。
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {

      // 我们将增加 `current` 以跳过括号，因为我们在 AST 中不关心它。
      token = tokens[++current];

      // 我们创建一个类型为 `CallExpression` 的基本节点，并且我们将把名称设置为
      // 当前 token 的值，因为左括号后的下一个 token 是函数的名称。
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // 我们*再次*增加 `current` 以跳过名称 token。
      token = tokens[++current];

      // 现在我们想循环遍历每个将成为我们 `CallExpression` 的 `params` 的 token，
      // 直到我们遇到一个右括号。
      //
      // 现在这就是递归发挥作用的地方。我们不是试图解析一个可能无限嵌套的节点集，
      // 而是要依靠递归来解决问题。
      //
      // 为了解释这一点，让我们看看我们的 Lisp 代码。你可以看到 `add` 的参数是一个
      // 数字和一个嵌套的 `CallExpression`，其中包含自己的数字。
      //
      //   (add 2 (subtract 4 2))
      //
      // 你还会注意到，在我们的 tokens 数组中，我们有多个右括号。
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< 右括号
      //     { type: 'paren',  value: ')'        }, <<< 右括号
      //   ]
      //
      // 我们将依靠嵌套的 `walk` 函数将我们的 `current` 变量增加到超过任何嵌套的 `CallExpression`。

      // 所以我们创建一个 `while` 循环，它将一直持续到遇到一个 `type` 为 `'paren'` 且
      // `value` 为右括号的 token。
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        // 我们将调用 `walk` 函数，它将返回一个 `node`，我们将其推入我们的 `node.params`。
        node.params.push(walk());
        token = tokens[current];
      }

      // 最后，我们将最后一次增加 `current` 以跳过右括号。
      current++;

      // 并返回节点。
      return node;
    }

    // 同样，如果到现在我们还没有识别出 token 类型，我们将抛出一个错误。
    throw new TypeError(token.type);
  }

  // 现在，我们要创建我们的 AST，它将有一个根节点，是一个 `Program` 节点。
  let ast = {
    type: 'Program',
    body: [],
  };

  // 我们将启动我们的 `walk` 函数，将节点推入我们的 `ast.body` 数组。
  //
  // 我们在循环内执行此操作的原因是我们的程序可以有一个接一个的 `CallExpression`，
  // 而不是嵌套的。
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // 在我们的解析器的最后，我们将返回 AST。
  return ast;
}

/**
 * ============================================================================
 *                                 ⌒(❀>◞౪◟<❀)⌒
 *                               遍历器（THE TRAVERSER）!!!
 * ============================================================================
 */

/**
 * 所以现在我们有了我们的 AST，我们希望能够用访问者访问不同的节点。
 * 每当我们遇到一个匹配类型的节点时，我们需要能够调用访问者上的方法。
 *
 *   traverse(ast, {
 *     Program: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     CallExpression: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     NumberLiteral: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *   });
 */

// 所以我们定义一个 traverser 函数，它接受一个 AST 和一个访问者。
// 在内部我们要定义两个函数...
function traverser(ast, visitor) {

  // 一个 `traverseArray` 函数，它将允许我们遍历一个数组并调用我们将定义的下一个函数：`traverseNode`。
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  // `traverseNode` 将接受一个 `node` 和它的 `parent` 节点。这样它就可以将两者都传递给我们的访问者方法。
  function traverseNode(node, parent) {

    // 我们首先测试访问者上是否存在一个匹配 `type` 的方法。
    let methods = visitor[node.type];

    // 如果这个节点类型有一个 `enter` 方法，我们将用 `node` 和它的 `parent` 调用它。
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    // 接下来我们将根据当前节点类型拆分事物。
    switch (node.type) {

      // 我们将从顶级 `Program` 开始。由于 Program 节点有一个名为 body 的属性，
      // 其中有一个节点数组，我们将调用 `traverseArray` 向下遍历它们。
      //
      // （记住 `traverseArray` 将反过来调用 `traverseNode`，所以我们导致树被递归遍历）
      case 'Program':
        traverseArray(node.body, node);
        break;

      // 接下来我们对 `CallExpression` 做同样的事情并遍历它们的 `params`。
      case 'CallExpression':
        traverseArray(node.params, node);
        break;

      // 在 `NumberLiteral` 和 `StringLiteral` 的情况下，我们没有任何子节点要访问，
      // 所以我们只是 break。
      case 'NumberLiteral':
      case 'StringLiteral':
        break;

      // 同样，如果我们还没有识别出节点类型，我们将抛出一个错误。
      default:
        throw new TypeError(node.type);
    }

    // 如果这个节点类型有一个 `exit` 方法，我们将用 `node` 和它的 `parent` 调用它。
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  // 最后，我们通过用我们的 ast 调用 `traverseNode` 来启动遍历器，没有 `parent`，
  // 因为 AST 的顶层没有父节点。
  traverseNode(ast, null);
}

/**
 * ============================================================================
 *                                   ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽
 *                              转换器（THE TRANSFORMER）!!!
 * ============================================================================
 */

/**
 * 接下来，转换器。我们的转换器将获取我们构建的 AST，并将其传递给我们的 traverser 函数，
 * 连同一个访问者，并将创建一个新的 ast。
 *
 * ----------------------------------------------------------------------------
 *   原始 AST                      |   转换后的 AST
 * ----------------------------------------------------------------------------
 *   {                                |   {
 *     type: 'Program',               |     type: 'Program',
 *     body: [{                       |     body: [{
 *       type: 'CallExpression',      |       type: 'ExpressionStatement',
 *       name: 'add',                 |       expression: {
 *       params: [{                   |         type: 'CallExpression',
 *         type: 'NumberLiteral',     |         callee: {
 *         value: '2'                 |           type: 'Identifier',
 *       }, {                         |           name: 'add'
 *         type: 'CallExpression',    |         },
 *         name: 'subtract',          |         arguments: [{
 *         params: [{                 |           type: 'NumberLiteral',
 *           type: 'NumberLiteral',   |           value: '2'
 *           value: '4'               |         }, {
 *         }, {                       |           type: 'CallExpression',
 *           type: 'NumberLiteral',   |           callee: {
 *           value: '2'               |             type: 'Identifier',
 *         }]                         |             name: 'subtract'
 *       }]                           |           },
 *     }]                             |           arguments: [{
 *   }                                |             type: 'NumberLiteral',
 *                                    |             value: '4'
 * ---------------------------------- |           }, {
 *                                    |             type: 'NumberLiteral',
 *                                    |             value: '2'
 *                                    |           }]
 *  (抱歉另一个更长。)                |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */

// 所以我们有我们的 transformer 函数，它将接受 lisp ast。
function transformer(ast) {

  // 我们将创建一个 `newAst`，就像我们之前的 AST 一样，它将有一个 program 节点。
  let newAst = {
    type: 'Program',
    body: [],
  };

  // 接下来我要稍微作弊并创建一点小技巧。我们将在父节点上使用一个名为 `context` 的属性，
  // 我们将把节点推送到它们父节点的 `context` 中。通常你会有一个比这更好的抽象，
  // 但为了我们的目的，这使事情变得简单。
  //
  // 只需注意 context 是*从*旧 ast *到*新 ast 的引用。
  ast._context = newAst.body;

  // 我们将通过用我们的 ast 和一个访问者调用 traverser 函数来开始。
  traverser(ast, {

    // 第一个访问者方法接受任何 `NumberLiteral`
    NumberLiteral: {
      // 我们将在进入时访问它们。
      enter(node, parent) {
        // 我们将创建一个也名为 `NumberLiteral` 的新节点，我们将推送到父 context。
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },

    // 接下来我们有 `StringLiteral`
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },

    // 接下来，`CallExpression`。
    CallExpression: {
      enter(node, parent) {

        // 我们开始创建一个新节点 `CallExpression`，带有一个嵌套的 `Identifier`。
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // 接下来我们将在原始 `CallExpression` 节点上定义一个新的 context，
        // 它将引用 `expression` 的 arguments，这样我们就可以推送参数。
        node._context = expression.arguments;

        // 然后我们要检查父节点是否是 `CallExpression`。如果不是...
        if (parent.type !== 'CallExpression') {

          // 我们将用 `ExpressionStatement` 包装我们的 `CallExpression` 节点。
          // 我们这样做是因为 JavaScript 中的顶级 `CallExpression` 实际上是语句。
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          };
        }

        // 最后，我们将（可能被包装的）`CallExpression` 推送到 `parent` 的 `context`。
        parent._context.push(expression);
      },
    }
  });

  // 在我们的 transformer 函数的最后，我们将返回我们刚刚创建的新 ast。
  return newAst;
}

/**
 * ============================================================================
 *                               ヾ（〃＾∇＾）ﾉ♪
 *                            代码生成器（THE CODE GENERATOR）!!!!
 * ============================================================================
 */

/**
 * 现在让我们进入我们的最后阶段：代码生成器。
 *
 * 我们的代码生成器将递归调用自身，将树中的每个节点打印成一个巨大的字符串。
 */

function codeGenerator(node) {

  // 我们将根据 `node` 的 `type` 拆分事物。
  switch (node.type) {

    // 如果我们有一个 `Program` 节点。我们将遍历 `body` 中的每个节点，
    // 并通过代码生成器运行它们，用换行符连接它们。
    case 'Program':
      return node.body.map(codeGenerator)
        .join('\n');

    // 对于 `ExpressionStatement`，我们将在嵌套的 expression 上调用代码生成器，
    // 并添加一个分号...
    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) +
        ';' // << (...因为我们喜欢以*正确*的方式编码)
      );

    // 对于 `CallExpression`，我们将打印 `callee`，添加一个左括号，我们将遍历
    // `arguments` 数组中的每个节点，并通过代码生成器运行它们，用逗号连接它们，
    // 然后我们将添加一个右括号。
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator)
          .join(', ') +
        ')'
      );

    // 对于 `Identifier`，我们只返回 `node` 的名称。
    case 'Identifier':
      return node.name;

    // 对于 `NumberLiteral`，我们只返回 `node` 的值。
    case 'NumberLiteral':
      return node.value;

    // 对于 `StringLiteral`，我们将在 `node` 的值周围添加引号。
    case 'StringLiteral':
      return '"' + node.value + '"';

    // 如果我们还没有识别出节点，我们将抛出一个错误。
    default:
      throw new TypeError(node.type);
  }
}

/**
 * ============================================================================
 *                                  (۶* 'ヮ')۶"
 *                         !!!!!!!!编译器（THE COMPILER）!!!!!!!!
 * ============================================================================
 */

/**
 * 最后！我们将创建我们的 `compiler` 函数。在这里，我们将把管道的每个部分链接在一起。
 *
 *   1. input  => tokenizer   => tokens
 *   2. tokens => parser      => ast
 *   3. ast    => transformer => newAst
 *   4. newAst => generator   => output
 */

function compiler(input) {
  let tokens = tokenizer(input);
  let ast    = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);

  // 然后简单地返回输出！
  return output;
}

/**
 * ============================================================================
 *                                   (๑˃̵ᴗ˂̵)و
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!你做到了!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ============================================================================
 */

// 现在我只是导出所有东西...
module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler,
};
