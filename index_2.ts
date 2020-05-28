export type DependencyTree1<Values extends string> = {
  [Key in Values]: ReadonlyArray<Exclude<Values, Key>>;
};

export const dependencyTree1: DependencyTree1<"a" | "b" | "c" | "d"> = {
  a: ["d"],
  b: ["a"],
  c: ["a"],
  d: ["b", "c"],
};

export type DependencyTree2<T> = T extends {
  [K in keyof T]: ReadonlyArray<keyof DependencyTree2<Omit<T, K>>>;
}
  ? T
  : never;

export type MyDependencyTree2 = DependencyTree2<{
  a: ["d"];
  b: ["a"];
  c: ["a"];
  d: ["b", "c"];
}>;

type UnArray<A> = A extends Array<infer V> ? V : never;

export type DependencyTree<
  T extends Readonly<{readonly [key: string]: string[]}>
> = DependencyTree_<T, keyof T>;
export type DependencyTree_<T, Ks extends keyof T> = {} extends T
  ? {}
  : {
      [K in Ks]: T[K] extends []
        ? []
        : T[K] extends Array<Exclude<keyof T, K>>
        ? Omit<T, K> extends DependencyTree_<
            Omit<T, K>,
            UnArray<T[K]> & Exclude<keyof T, K>
          >
          ? T[K]
          : never
        : never;
    };

export type Foo = DependencyTree<{
  a: ["b"];
  b: ["a"];
}>;

export type MyDependencyTree = DependencyTree<{
  a: [];
  b: ["a"];
  c: ["a"];
  d: ["b", "c"];
}>;

export const dependencyTree: MyDependencyTree = {
  a: [],
  b: ["a"],
  c: ["a"],
  d: ["b", "c"],
};

export type AnyCalculations = {
  [key: string]: {dependencies: string[]; result: any};
};

export type Computation<T extends AnyCalculations> = {
  [K in keyof T]: T[K]["dependencies"];
} extends DependencyTree<{[K in keyof T]: T[K]["dependencies"]}>
  ? {
      [K in keyof T]: {
        dependencies?: T[K]["dependencies"];
        compute: (
          calculations: {[key in keyof T]: T[K]["result"]},
        ) => T[K]["result"];
      };
    }
  : never;

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

export const solveQuadraticEquation = (
  a: number,
  b: number,
  c: number,
): Computation<Calculations> => ({
  a: {
    dependencies: [],
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

export const run = <T extends AnyCalculations>(
  computation: Computation<T>,
): T => {
  type Computed = {[K in keyof T]: T[K]["result"]};
  const computed: Partial<Computed> = {};
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
      computed[name] = computation[name].compute(computed as Computed);
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
  const outputs = run<Calculations>(solveQuadraticEquation(a, b, c));
  console.log(`Root 1: ${outputs.positiveRoot}`);
  console.log(`Root 2: ${outputs.negativeRoot}`);
}
