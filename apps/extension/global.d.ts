export {};
declare global {
	interface Window {
		/** @description Student and its componentsIds */
		matriculas: Record<number, string[]>;
    /** UFABC matricula sessionId */
    sessionId: string | null;
	}
}
