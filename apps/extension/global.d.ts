export {};
declare global {
	interface Window {
		/** @description Student and its componentsIds */
		matriculas: Record<number, Array<number>>;
    /** UFABC matricula sessionId */
    sessionId: string | null;
	}
}
