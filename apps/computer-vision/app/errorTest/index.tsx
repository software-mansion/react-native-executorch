import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import {
  type Tensor,
  tensor,
  RnExecuTorchError,
  isRnExecuTorchError,
  wrapAsync,
} from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ColorPalette } from '../../theme';

interface ErrorOutput {
  name: string;
  code?: string;
  message: string;
  isRnExecuTorchError: boolean;
  isStandardError: boolean;
  rawType: string;
  passed: boolean;
  expectedDescription: string;
}

interface SuiteResult {
  title: string;
  passed: boolean;
  expected: string;
}

interface SuiteSummary {
  total: number;
  passedCount: number;
  failedCount: number;
  results: SuiteResult[];
}

function ErrorTestContent() {
  const [output, setOutput] = useState<ErrorOutput | null>(null);
  const [suiteSummary, setSuiteSummary] = useState<SuiteSummary | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const checkTestResult = (
    e: any,
    expected: { isRnExecuTorchError?: boolean; code?: string; isStandardError?: boolean },
    expectedDescription: string
  ): ErrorOutput => {
    const isRnError = isRnExecuTorchError(e);
    const isStdError = e instanceof Error;
    const codeMatches = expected.code ? e?.code === expected.code : true;
    const rnMatches =
      expected.isRnExecuTorchError !== undefined
        ? isRnError === expected.isRnExecuTorchError
        : true;
    const stdMatches =
      expected.isStandardError !== undefined ? isStdError === expected.isStandardError : true;

    const passed = codeMatches && rnMatches && stdMatches;

    return {
      name: String(e?.name ?? 'Unknown'),
      code: e?.code,
      message: String(e?.message ?? String(e)),
      isRnExecuTorchError: isRnError,
      isStandardError: isStdError,
      rawType: typeof e === 'object' && e !== null ? e.constructor?.name || 'Object' : typeof e,
      passed,
      expectedDescription,
    };
  };

  const setCaughtError = (
    e: any,
    expected: { isRnExecuTorchError?: boolean; code?: string; isStandardError?: boolean },
    expectedDescription: string
  ) => {
    setOutput(checkTestResult(e, expected, expectedDescription));
  };

  const runTest = (
    testFn: () => void,
    expected: { isRnExecuTorchError?: boolean; code?: string; isStandardError?: boolean },
    expectedDescription: string
  ) => {
    setOutput(null);
    try {
      testFn();
    } catch (e: any) {
      setCaughtError(e, expected, expectedDescription);
    }
  };

  const testRnExecuTorchErrorInsideThrough = () => {
    runTest(
      () => {
        const src = tensor('float32', [2, 2]);
        try {
          src.through(() => {
            throw RnExecuTorchError(
              'INVALID_ARGUMENT',
              'Custom RnExecuTorchError thrown inside tensor.through callback'
            );
          });
        } finally {
          src.dispose();
        }
      },
      { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
      'RnExecuTorchError (INVALID_ARGUMENT)'
    );
  };

  const testStandardErrorInsideThrough = () => {
    runTest(
      () => {
        const src = tensor('float32', [2, 2]);
        try {
          src.through(() => {
            throw new Error('Custom standard JS Error thrown inside tensor.through callback');
          });
        } finally {
          src.dispose();
        }
      },
      { isRnExecuTorchError: false, isStandardError: true },
      'Standard JS Error (isRnExecuTorchError === false)'
    );
  };

  const testNativeErrorInsideThrough = () => {
    runTest(
      () => {
        const src = tensor('float32', [2, 2]);
        const dst = tensor('float32', [3, 3]);
        try {
          src.through((s: Tensor, d: Tensor) => {
            s.copyTo(d);
          }, dst);
        } finally {
          src.dispose();
          dst.dispose();
        }
      },
      { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
      'Native C++ Exception -> RnExecuTorchError (INVALID_ARGUMENT)'
    );
  };

  const testDisposedTensorAccess = () => {
    runTest(
      () => {
        const src = tensor('float32', [2, 2]);
        src.dispose();
        src.getData(new Float32Array(4));
      },
      { isRnExecuTorchError: true, code: 'RESOURCE_DISPOSED' },
      'Native C++ Exception -> RnExecuTorchError (RESOURCE_DISPOSED)'
    );
  };

  const testNestedThroughNativeError = () => {
    runTest(
      () => {
        const t1 = tensor('float32', [2, 2]);
        const t2 = tensor('float32', [3, 3]);
        try {
          t1.through(() => {
            t2.through(() => {
              t1.copyTo(t2);
            });
          });
        } finally {
          t1.dispose();
          t2.dispose();
        }
      },
      { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
      'Nested C++ Exception -> RnExecuTorchError (INVALID_ARGUMENT)'
    );
  };

  const testThroughIfError = () => {
    runTest(
      () => {
        const src = tensor('float32', [2, 2]);
        try {
          src.throughIf(true, () => {
            throw RnExecuTorchError(
              'SCHEMA_MISMATCH',
              'Error inside conditionally executed throughIf'
            );
          });
        } finally {
          src.dispose();
        }
      },
      { isRnExecuTorchError: true, code: 'SCHEMA_MISMATCH' },
      'RnExecuTorchError (SCHEMA_MISMATCH)'
    );
  };

  const testWrapAsyncExecuTorchError = async () => {
    setOutput(null);
    const asyncFn = wrapAsync(() => {
      'worklet';
      throw RnExecuTorchError('LOAD_FAILED', 'Failed to load model inside wrapAsync worklet');
    });
    try {
      await asyncFn();
    } catch (e: any) {
      setCaughtError(
        e,
        { isRnExecuTorchError: true, code: 'LOAD_FAILED' },
        'wrapAsync Worklet -> RnExecuTorchError (LOAD_FAILED)'
      );
    }
  };

  const testWrapAsyncNativeJsiError = async () => {
    setOutput(null);
    const asyncFn = wrapAsync(() => {
      'worklet';
      const src = tensor('float32', [2, 2]);
      src.dispose();
      src.getData(new Float32Array(4));
    });
    try {
      await asyncFn();
    } catch (e: any) {
      setCaughtError(
        e,
        { isRnExecuTorchError: true, code: 'RESOURCE_DISPOSED' },
        'wrapAsync Native Exception -> RnExecuTorchError (RESOURCE_DISPOSED)'
      );
    }
  };

  const testWrapAsyncThroughRnExecuTorchError = async () => {
    setOutput(null);
    const asyncFn = wrapAsync(() => {
      'worklet';
      const src = tensor('float32', [2, 2]);
      try {
        src.through(() => {
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
            'RnExecuTorchError inside through() inside wrapAsync()'
          );
        });
      } finally {
        src.dispose();
      }
    });
    try {
      await asyncFn();
    } catch (e: any) {
      setCaughtError(
        e,
        { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        'wrapAsync + through -> RnExecuTorchError (INVALID_ARGUMENT)'
      );
    }
  };

  const testWrapAsyncThroughStandardError = async () => {
    setOutput(null);
    const asyncFn = wrapAsync(() => {
      'worklet';
      const src = tensor('float32', [2, 2]);
      try {
        src.through(() => {
          throw new Error('Standard JS Error inside through() inside wrapAsync()');
        });
      } finally {
        src.dispose();
      }
    });
    try {
      await asyncFn();
    } catch (e: any) {
      setCaughtError(
        e,
        { isRnExecuTorchError: false, isStandardError: true },
        'wrapAsync + through -> Standard JS Error'
      );
    }
  };

  const testWrapAsyncThroughNativeJsiError = async () => {
    setOutput(null);
    const asyncFn = wrapAsync(() => {
      'worklet';
      const src = tensor('float32', [2, 2]);
      const dst = tensor('float32', [3, 3]);
      try {
        src.through((s: Tensor, d: Tensor) => {
          s.copyTo(d);
        }, dst);
      } finally {
        src.dispose();
        dst.dispose();
      }
    });
    try {
      await asyncFn();
    } catch (e: any) {
      setCaughtError(
        e,
        { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        'wrapAsync + through Native C++ -> RnExecuTorchError (INVALID_ARGUMENT)'
      );
    }
  };

  const testWrapAsyncNestedThroughRnExecuTorchError = async () => {
    setOutput(null);
    const asyncFn = wrapAsync(() => {
      'worklet';
      const t1 = tensor('float32', [2, 2]);
      const t2 = tensor('float32', [2, 2]);
      try {
        t1.through(() => {
          t2.through(() => {
            throw RnExecuTorchError(
              'INVALID_ARGUMENT',
              'RnExecuTorchError inside double nested through() inside wrapAsync()'
            );
          });
        });
      } finally {
        t1.dispose();
        t2.dispose();
      }
    });
    try {
      await asyncFn();
    } catch (e: any) {
      setCaughtError(
        e,
        { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        'wrapAsync + double through -> RnExecuTorchError (INVALID_ARGUMENT)'
      );
    }
  };

  const testWrapAsyncNestedThroughNativeJsiError = async () => {
    setOutput(null);
    const asyncFn = wrapAsync(() => {
      'worklet';
      const t1 = tensor('float32', [2, 2]);
      const t2 = tensor('float32', [3, 3]);
      try {
        t1.through(() => {
          t2.through(() => {
            t1.copyTo(t2);
          });
        });
      } finally {
        t1.dispose();
        t2.dispose();
      }
    });
    try {
      await asyncFn();
    } catch (e: any) {
      setCaughtError(
        e,
        { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        'wrapAsync + double through Native C++ -> RnExecuTorchError (INVALID_ARGUMENT)'
      );
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    setOutput(null);
    setSuiteSummary(null);

    const testDefinitions: {
      title: string;
      fn: () => void | Promise<void>;
      expected: { isRnExecuTorchError?: boolean; code?: string; isStandardError?: boolean };
      expectedDescription: string;
    }[] = [
      {
        title: '1. Throw RnExecuTorchError inside through()',
        fn: () => {
          const src = tensor('float32', [2, 2]);
          try {
            src.through(() => {
              throw RnExecuTorchError('INVALID_ARGUMENT', 'Custom error');
            });
          } finally {
            src.dispose();
          }
        },
        expected: { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        expectedDescription: 'RnExecuTorchError (INVALID_ARGUMENT)',
      },
      {
        title: '2. Throw standard Error inside through()',
        fn: () => {
          const src = tensor('float32', [2, 2]);
          try {
            src.through(() => {
              throw new Error('Standard JS Error');
            });
          } finally {
            src.dispose();
          }
        },
        expected: { isRnExecuTorchError: false, isStandardError: true },
        expectedDescription: 'Standard JS Error',
      },
      {
        title: '3. Trigger Native JSI Exception inside through()',
        fn: () => {
          const src = tensor('float32', [2, 2]);
          const dst = tensor('float32', [3, 3]);
          try {
            src.through((s: Tensor, d: Tensor) => {
              s.copyTo(d);
            }, dst);
          } finally {
            src.dispose();
            dst.dispose();
          }
        },
        expected: { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        expectedDescription: 'Native C++ Exception -> RnExecuTorchError',
      },
      {
        title: '4. Nested through() Native Exception',
        fn: () => {
          const t1 = tensor('float32', [2, 2]);
          const t2 = tensor('float32', [3, 3]);
          try {
            t1.through(() => {
              t2.through(() => {
                t1.copyTo(t2);
              });
            });
          } finally {
            t1.dispose();
            t2.dispose();
          }
        },
        expected: { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        expectedDescription: 'Nested C++ Exception -> RnExecuTorchError',
      },
      {
        title: '5. Conditional throughIf() Exception',
        fn: () => {
          const src = tensor('float32', [2, 2]);
          try {
            src.throughIf(true, () => {
              throw RnExecuTorchError('SCHEMA_MISMATCH', 'throughIf error');
            });
          } finally {
            src.dispose();
          }
        },
        expected: { isRnExecuTorchError: true, code: 'SCHEMA_MISMATCH' },
        expectedDescription: 'RnExecuTorchError (SCHEMA_MISMATCH)',
      },
      {
        title: '6. Access Disposed Tensor',
        fn: () => {
          const src = tensor('float32', [2, 2]);
          src.dispose();
          src.getData(new Float32Array(4));
        },
        expected: { isRnExecuTorchError: true, code: 'RESOURCE_DISPOSED' },
        expectedDescription: 'RnExecuTorchError (RESOURCE_DISPOSED)',
      },
      {
        title: '7. wrapAsync() Worklet RnExecuTorchError',
        fn: async () => {
          const asyncFn = wrapAsync(() => {
            'worklet';
            throw RnExecuTorchError('LOAD_FAILED', 'Failed worklet');
          });
          await asyncFn();
        },
        expected: { isRnExecuTorchError: true, code: 'LOAD_FAILED' },
        expectedDescription: 'wrapAsync Worklet -> LOAD_FAILED',
      },
      {
        title: '8. wrapAsync() Worklet Native JSI Error',
        fn: async () => {
          const asyncFn = wrapAsync(() => {
            'worklet';
            const src = tensor('float32', [2, 2]);
            src.dispose();
            src.getData(new Float32Array(4));
          });
          await asyncFn();
        },
        expected: { isRnExecuTorchError: true, code: 'RESOURCE_DISPOSED' },
        expectedDescription: 'wrapAsync Native -> RESOURCE_DISPOSED',
      },
      {
        title: '9. wrapAsync() + through() with RnExecuTorchError',
        fn: async () => {
          const asyncFn = wrapAsync(() => {
            'worklet';
            const src = tensor('float32', [2, 2]);
            try {
              src.through(() => {
                throw RnExecuTorchError('INVALID_ARGUMENT', 'inside through');
              });
            } finally {
              src.dispose();
            }
          });
          await asyncFn();
        },
        expected: { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        expectedDescription: 'wrapAsync + through -> RnExecuTorchError',
      },
      {
        title: '10. wrapAsync() + through() with Standard Error',
        fn: async () => {
          const asyncFn = wrapAsync(() => {
            'worklet';
            const src = tensor('float32', [2, 2]);
            try {
              src.through(() => {
                throw new Error('Standard error inside through');
              });
            } finally {
              src.dispose();
            }
          });
          await asyncFn();
        },
        expected: { isRnExecuTorchError: false, isStandardError: true },
        expectedDescription: 'wrapAsync + through -> Standard JS Error',
      },
      {
        title: '11. wrapAsync() + through() with Native JSI Error',
        fn: async () => {
          const asyncFn = wrapAsync(() => {
            'worklet';
            const src = tensor('float32', [2, 2]);
            const dst = tensor('float32', [3, 3]);
            try {
              src.through((s: Tensor, d: Tensor) => {
                s.copyTo(d);
              }, dst);
            } finally {
              src.dispose();
              dst.dispose();
            }
          });
          await asyncFn();
        },
        expected: { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        expectedDescription: 'wrapAsync + through Native C++ -> INVALID_ARGUMENT',
      },
      {
        title: '12. wrapAsync() + Nested through() with RnExecuTorchError',
        fn: async () => {
          const asyncFn = wrapAsync(() => {
            'worklet';
            const t1 = tensor('float32', [2, 2]);
            const t2 = tensor('float32', [2, 2]);
            try {
              t1.through(() => {
                t2.through(() => {
                  throw RnExecuTorchError('INVALID_ARGUMENT', 'Double through');
                });
              });
            } finally {
              t1.dispose();
              t2.dispose();
            }
          });
          await asyncFn();
        },
        expected: { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        expectedDescription: 'wrapAsync + double through -> RnExecuTorchError',
      },
      {
        title: '13. wrapAsync() + Nested through() with Native JSI Error',
        fn: async () => {
          const asyncFn = wrapAsync(() => {
            'worklet';
            const t1 = tensor('float32', [2, 2]);
            const t2 = tensor('float32', [3, 3]);
            try {
              t1.through(() => {
                t2.through(() => {
                  t1.copyTo(t2);
                });
              });
            } finally {
              t1.dispose();
              t2.dispose();
            }
          });
          await asyncFn();
        },
        expected: { isRnExecuTorchError: true, code: 'INVALID_ARGUMENT' },
        expectedDescription: 'wrapAsync + double through Native C++ -> INVALID_ARGUMENT',
      },
    ];

    const results: SuiteResult[] = [];
    let passedCount = 0;

    for (const testDef of testDefinitions) {
      try {
        await testDef.fn();
        results.push({
          title: testDef.title,
          passed: false,
          expected: testDef.expectedDescription,
        });
      } catch (e: any) {
        const res = checkTestResult(e, testDef.expected, testDef.expectedDescription);
        if (res.passed) {
          passedCount++;
        }
        results.push({
          title: testDef.title,
          passed: res.passed,
          expected: testDef.expectedDescription,
        });
      }
    }

    setSuiteSummary({
      total: testDefinitions.length,
      passedCount,
      failedCount: testDefinitions.length - passedCount,
      results,
    });
    setIsRunningAll(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Error Propagation Test</Text>
        <Text style={styles.cardDescription}>
          Test how errors thrown inside callbacks passed to{' '}
          <Text style={styles.codeText}>tensor.through(...)</Text>, conditional throughIf, and
          worklet functions wrapped via <Text style={styles.codeText}>wrapAsync(...)</Text> travel
          back through JSI and JavaScript boundaries.
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.runAllButton]}
          onPress={runAllTests}
          disabled={isRunningAll}
          activeOpacity={0.8}
        >
          <Text style={styles.runAllButtonText}>
            {isRunningAll ? '⏳ Running All Tests...' : '⚡ Run All 13 Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testRnExecuTorchErrorInsideThrough}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>1. Throw RnExecuTorchError inside through()</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testStandardErrorInsideThrough}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>2. Throw standard Error inside through()</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testNativeErrorInsideThrough}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>3. Trigger Native JSI Exception inside through()</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testNestedThroughNativeError}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>4. Nested through() Native Exception</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testThroughIfError} activeOpacity={0.8}>
          <Text style={styles.buttonText}>5. Conditional throughIf() Exception</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testDisposedTensorAccess}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>6. Access Disposed Tensor (RESOURCE_DISPOSED)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testWrapAsyncExecuTorchError}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>7. wrapAsync() Worklet RnExecuTorchError</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testWrapAsyncNativeJsiError}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>8. wrapAsync() Worklet Native JSI Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testWrapAsyncThroughRnExecuTorchError}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>9. wrapAsync() + through() with RnExecuTorchError</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testWrapAsyncThroughStandardError}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>10. wrapAsync() + through() with Standard Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testWrapAsyncThroughNativeJsiError}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>11. wrapAsync() + through() with Native JSI Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testWrapAsyncNestedThroughRnExecuTorchError}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            12. wrapAsync() + Nested through() with RnExecuTorchError
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testWrapAsyncNestedThroughNativeJsiError}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            13. wrapAsync() + Nested through() with Native JSI Error
          </Text>
        </TouchableOpacity>
      </View>

      {suiteSummary && (
        <View style={styles.suiteSummaryCard}>
          <View style={styles.resultsHeaderRow}>
            <Text style={styles.resultsHeader}>Suite Summary</Text>
            <View
              style={[
                styles.statusBanner,
                suiteSummary.failedCount === 0 ? styles.statusPassed : styles.statusFailed,
              ]}
            >
              <Text style={styles.statusText}>
                {suiteSummary.passedCount} / {suiteSummary.total} PASSED
              </Text>
            </View>
          </View>

          {suiteSummary.results.map((res, i) => (
            <View key={i} style={styles.suiteRow}>
              <Text style={styles.suiteTitle} numberOfLines={1}>
                {res.title}
              </Text>
              <View style={[styles.badge, res.passed ? styles.badgeSuccess : styles.badgeDefault]}>
                <Text
                  style={[
                    styles.badgeText,
                    res.passed ? styles.badgeTextSuccess : styles.badgeTextDefault,
                  ]}
                >
                  {res.passed ? 'PASSED' : 'FAILED'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {output && (
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeaderRow}>
            <Text style={styles.resultsHeader}>Caught Error Output</Text>
            <View
              style={[
                styles.statusBanner,
                output.passed ? styles.statusPassed : styles.statusFailed,
              ]}
            >
              <Text style={styles.statusText}>{output.passed ? '✓ PASSED' : '✕ FAILED'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expected Result:</Text>
            <Text style={styles.detailValue}>{output.expectedDescription}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>isRnExecuTorchError:</Text>
            <View
              style={[
                styles.badge,
                output.isRnExecuTorchError ? styles.badgeSuccess : styles.badgeDefault,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  output.isRnExecuTorchError ? styles.badgeTextSuccess : styles.badgeTextDefault,
                ]}
              >
                {String(output.isRnExecuTorchError)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>name:</Text>
            <Text style={styles.detailValue}>{output.name}</Text>
          </View>

          {output.code !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>code:</Text>
              <Text style={[styles.detailValue, styles.codeValue]}>{output.code}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>message:</Text>
            <Text style={styles.detailValue}>{output.message}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>instanceof Error:</Text>
            <Text style={styles.detailValue}>{String(output.isStandardError)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Constructor / Type:</Text>
            <Text style={styles.detailValue}>{output.rawType}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

export default function ErrorTestScreen() {
  return (
    <ScreenWrapper>
      <ErrorTestContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ColorPalette.strongPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
  },
  codeText: {
    fontFamily: 'Platform',
    fontWeight: '600',
    color: ColorPalette.primary,
  },
  button: {
    backgroundColor: ColorPalette.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: ColorPalette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  runAllButton: {
    backgroundColor: '#2563eb',
    marginBottom: 20,
    paddingVertical: 16,
  },
  runAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  suiteSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  suiteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  suiteTitle: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 10,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  statusBanner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusPassed: {
    backgroundColor: '#2b8a3e',
  },
  statusFailed: {
    backgroundColor: '#e03131',
  },
  statusText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#868e96',
  },
  detailValue: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  codeValue: {
    color: '#d63031',
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: '#e6fcf5',
  },
  badgeDefault: {
    backgroundColor: '#f1f3f5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextSuccess: {
    color: '#0ca678',
  },
  badgeTextDefault: {
    color: '#495057',
  },
});
