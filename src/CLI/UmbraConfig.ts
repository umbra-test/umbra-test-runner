interface UmbraConfig {

    /**
     * List of globs pointing to test files to execute.
     */
    input: string[];

    /**
     * Whether or not to run with the Node debugger enabled.
     */
    debug: boolean;

    /**
     * Whether or not to run with the Node Debugger, immediately breaking after the first file.
     */
    debugBreak: boolean;

    /**
     * Whether or not to run in "watch mode", which will execute all tests once, and then again once the individual files
     * change.
     */
    watch: boolean;

    /**
     * The directory in which to store all Umbra cache files.
     */
    cacheDir: string;

    /**
     * Timeout values to use for asynchronous tests execution, in milliseconds. If a number, it's used across all async
     * functions (it, before, beforeEach, after, afterEach).
     */
    timeoutMs: number | {
        it: number;
        before: number;
        beforeEach: number;
        after: number;
        afterEach: number;
    };

    reporting: {
        outputPath: string;
        reporters: string[];
    };

    coverage: {
        srcGlob: string[];
        all: boolean;
        thresholds: number | {
            branches: number;
            functions: number;
            lines: number;
            statements: number;
        };
        ignoreSourceMaps: boolean;
    };

    parallel: {
        idempotentFiles: boolean;
        idempotentTests: boolean;
    };
}


/**
 * Umbra CLI (early draft API)
 *
 * Runs tests with Umbra.
 *
 * Commands
 *  umbra [options...] [fileGlob...] Runs the given files with the Umbra Test Runner.
 *
 * General Options
 *  --debug Enables the Node debugger.
 *  --debug-brk Enables the Node debugger, breaking once the first test is evaluated.
 *  --watch Enables watch mode, which will evaluate all tests first and then again once changes occur.
 *  --config Sets the config file path. Default: ./umbra.config.ts
 *  --cacheDir The directory in which to store umbra cache files used for dynamic optimization.
 *
 * Timeout
 *  --timeoutMs, -t Specifies the general asynchronous timeout value in milliseconds. This affects *all* async methods (it, before, after, etc.)
 *  --itTimeoutMs Specifies the asynchronous timeout value for `it` blocks in milliseconds. This overrides general settings.
 *  --beforeTimeoutMs Specifies the asynchronous timeout value for `before` blocks in milliseconds. This overrides general settings.
 *  --beforeEachTimeoutMs Specifies the asynchronous timeout value for `beforeEach` blocks in milliseconds. This overrides general settings.
 *  --afterTimeoutMs Specifies the asynchronous timeout value for `after` blocks in milliseconds. This overrides general settings.
 *  --afterEachTimeoutMs Specifies the asynchronous timeout value for `afterEach` blocks in milliseconds. This overrides general settings.
 *
 * Reporting
 *  --outputPath, -o The output directory to write the final results to.
 *  --reporters, -r The reporters to use by name or by file path.
 *
 * Code Coverage
 *  --srcGlob, -s The source glob for files to track code coverage against.
 *  --all, -a When set, all files in the given source directory (--srcGlob) are tracked, even if they're not touched by tests.
 *  --branches, -b What percent (%) of branches must be covered for the test run to pass.
 *  --functions, -b What percent (%) of branches must be covered for the test run to pass.
 *  --lines, -b What percent (%) of branches must be covered for the test run to pass.
 *  --statements, -b What percent (%) of branches must be covered for the test run to pass.
 *  --ignoreSourceMaps If set, source maps will be ignored for code-coverage.
 *
 * Parallel Execution
 *  --idempotentFiles If set, files are treated as idempotent (meaning other file execution does not affect it).
 *  --idempotentTests If set, tests are treated as idempotent (meaning other test execution does not affect it). Requires idempotent files.
 */
