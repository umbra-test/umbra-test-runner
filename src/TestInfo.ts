interface TestInfo {
    callback: () => void | Promise<any>;
    title: string;
    only?: boolean;
    timeoutMs?: number;
}

export {TestInfo};
