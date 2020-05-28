#!/usr/bin/env node

type UnArray<A> = A extends Array<infer V> ? V : never;

export type X = UnArray<number>;

export type DependencyTree<
  T extends {[key: string]: string[]},
  Keys extends keyof T = keyof T
> = T extends {
  [K in Keys]: T[K] extends []
    ? []
    : T[K] extends Array<Exclude<keyof T, K>>
    ? Omit<T, K> extends DependencyTree<
        Omit<T, K>,
        UnArray<T[K]> & Exclude<keyof T, K>
      >
      ? T[K]
      : never
    : never;
}
  ? T
  : {"Dependency cycle.": never};

export type MyDependencyTree = DependencyTree<{
  a: [];
  b: ["a"];
  c: ["a"];
  d: ["b", "c"];
}>;

export const dependencyTree: DependencyTree<{
  a: [];
  b: ["a"];
  c: ["a"];
  d: ["b", "c"];
}> = {
  a: [], // : [] | never[]
  b: ["a"], // : ["a"] | string[] | ("a" | "b" | "c" | "d")[]
  c: ["a"],
  d: ["b", "c"],
};

//////////

export type Calculations = {
  a: {
    dependencies: [];
    result: number;
  };
  b: {
    dependencies: [];
    result: number;
  };
  c: {
    dependencies: [];
    result: number;
  };
  bSquared: {
    dependencies: ["b"];
    result: number;
  };
  underTheSquareRoot: {
    dependencies: ["a", "c", "bSquared"];
    result: number;
  };
  squareRoot: {
    dependencies: ["underTheSquareRoot"];
    result: number;
  };
  positiveTopHalf: {
    dependencies: ["b", "squareRoot"];
    result: number;
  };
  negativeTopHalf: {
    dependencies: ["b", "squareRoot"];
    result: number;
  };
  bottomHalf: {
    dependencies: ["a"];
    result: number;
  };
  positiveRoot: {
    dependencies: ["positiveTopHalf", "bottomHalf"];
    result: number;
  };
  negativeRoot: {
    dependencies: ["positiveTopHalf", "bottomHalf"];
    result: number;
  };
};
const solveQuadraticEquation = (
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

type AnyCalculations = {[key: string]: {dependencies: string[]; result: any}};
type Dependencies<T extends AnyCalculations> = {
  [K in keyof T]: T[K]["dependencies"];
};
type Results<T extends AnyCalculations> = {[K in keyof T]: T[K]["result"]};

type Computation<T extends AnyCalculations> = Dependencies<
  T
> extends DependencyTree<Dependencies<T>>
  ? {
      [K in keyof T]: {
        dependencies?: T[K]["dependencies"];
        compute: (calculations: Results<T>) => T[K]["result"];
      };
    }
  : {"ERROR: Dependency cycle.": never} & never;

const run = <T extends AnyCalculations>(computation: Computation<T>): T => {
  const computed: Partial<T> = {};
  const toCompute = new Set(Object.keys(computation) as Array<keyof T>);
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
  if (process.argv.length !== 5) {
    console.error(`Usage: ${process.argv[1]} A B C`);
    process.exit(1);
  }
  const a = parseInt(process.argv[2]);
  const b = parseInt(process.argv[3]);
  const c = parseInt(process.argv[4]);
  console.log(`Solving for: ${a}x² + ${b}x + ${c} = 0`);
  const outputs = run<Calculations>(solveQuadraticEquation(a, b, c));
  console.log(`Root 1: ${outputs.positiveRoot}`);
  console.log(`Root 2: ${outputs.negativeRoot}`);
}
