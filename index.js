#!/usr/bin/env node

const solveQuadraticEquation = (a, b, c) => ({
  a: {
    compute: () => a,
  },
  b: {
    compute: () => b,
  },
  c: {
    compute: () => c,
  },
  bSquared: {
    dependencies: ["b"],
    compute: ({b}) => b * b,
  },
  underTheSquareRoot: {
    dependencies: ["a", "c", "bSquared"],
    compute: ({a, c, bSquared}) => bSquared - 4 * a * c,
  },
  squareRoot: {
    dependencies: ["underTheSquareRoot"],
    compute: ({underTheSquareRoot}) => Math.sqrt(underTheSquareRoot),
  },
  positiveTopHalf: {
    dependencies: ["b", "squareRoot"],
    compute: ({b, squareRoot}) => -b + squareRoot,
  },
  negativeTopHalf: {
    dependencies: ["b", "squareRoot"],
    compute: ({b, squareRoot}) => -b - squareRoot,
  },
  bottomHalf: {
    dependencies: ["a"],
    compute: ({a}) => 2 * a,
  },
  positiveRoot: {
    dependencies: ["positiveTopHalf", "bottomHalf"],
    compute: ({positiveTopHalf, bottomHalf}) => positiveTopHalf / bottomHalf,
  },
  negativeRoot: {
    dependencies: ["positiveTopHalf", "bottomHalf"],
    compute: ({negativeTopHalf, bottomHalf}) => negativeTopHalf / bottomHalf,
  },
});

const run = computation => {
  const computed = {};
  const toCompute = new Set(Object.keys(computation));
  while (toCompute.size > 0) {
    const next = Array.from(toCompute).filter(x =>
      (computation[x].dependencies || []).every(dep => computed[dep] != null),
    );
    if (next.length == 0) {
      throw new Error(
        `Cannot resolve dependencies for: ${Array.from(toCompute).join(", ")}`,
      );
    }
    for (const name of next) {
      computed[name] = computation[name].compute(computed);
      toCompute.delete(name);
    }
  }
  return computed;
};

if (require.main === module) {
  if (process.argv.length !== 5) {
    console.error(`Usage: ${process.argv[1]} A B C`);
    process.exit(1);
  }
  const a = process.argv[2];
  const b = process.argv[3];
  const c = process.argv[4];
  console.log(`Solving for: ${a}x² + ${b}x + ${c} = 0`);
  const outputs = run(solveQuadraticEquation(a, b, c));
  console.log(`Root 1: ${outputs.positiveRoot}`);
  console.log(`Root 2: ${outputs.negativeRoot}`);
}
