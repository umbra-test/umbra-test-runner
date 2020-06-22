interface TestInfo {
    callback: () => void | Promise<any>;
    describeTitleChain: string[];
    title: string;
    absoluteFilePath: string;
    skip: boolean;
    timeoutMs?: number;
}
export { TestInfo };
