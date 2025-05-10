export {};
declare global {
	interface Window {
		/** @description Student and its componentsIds */
		matriculas: Record<number, Array<numbers>>;
    /** UFABC matricula sessionId */
    sessionId: string;
	}
}
