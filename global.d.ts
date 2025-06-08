
// global.d.ts
export {};

declare global {
  interface GoogleScriptRun {
    withSuccessHandler(callback: (result: any, object?: any) => void): GoogleScriptRun;
    withFailureHandler(callback: (error: Error, object?: any) => void): GoogleScriptRun;
    withUserObject(object: any): GoogleScriptRun;
    [functionName: string]: (...args: any[]) => void;
  }

  const google: {
    script: {
      run: GoogleScriptRun;
      host: {
        close: () => void;
        setHeight: (height: number) => void;
        setWidth: (width: number) => void;
        origin: string;
        editor: {
            focus: () => void;
        };
      };
    };
  };
}
