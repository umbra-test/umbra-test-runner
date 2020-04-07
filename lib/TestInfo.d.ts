interface TestInfo {
    callback: () => void | Promise<any>;
    title: string;
    timeoutMs?: number;
}
export { TestInfo };
