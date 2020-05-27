export type Calculations = {
  a: number;
  b: number;
  c: number;
  bSquared: number;
  underTheSquareRoot: number;
  squareRoot: number;
  positiveTopHalf: number;
  negativeTopHalf: number;
  bottomHalf: number;
  positiveRoot: number;
  negativeRoot: number;
};

export type Computation<T> = {
  [K in keyof T]: {
    dependencies?: Array<keyof T>;
    compute: (calculations: T) => T[K];
  };
};

export const solveQuadraticEquation = (
  a: number,
  b: number,
  c: number,
): Computation<Calculations> => ({
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

export const run = <T>(computation: Computation<T>): T => {
  const computed: Partial<T> = {};
  const toCompute = new Set(Object.keys(computation)) as Set<keyof T>;
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
      computed[name] = computation[name].compute(computed as T);
      toCompute.delete(name);
    }
  }
  return computed as T;
};

if (require.main === module) {
  const a = parseInt(process.argv[2]);
  const b = parseInt(process.argv[3]);
  const c = parseInt(process.argv[4]);
  console.log(`Solving for: ${a}x² + ${b}x + ${c} = 0`);
  const outputs = run(solveQuadraticEquation(a, b, c));
  console.log(`Root 1: ${outputs.positiveRoot}`);
  console.log(`Root 2: ${outputs.negativeRoot}`);
}
