import { type StorageItemKey, storage } from "wxt/storage";
import { type UseAsyncStateOptions, useAsyncState } from "@vueuse/core";
import { computed, onMounted, onUnmounted } from "vue";

export function useStorage<T>(
	key: StorageItemKey,
	initialValue?: T,
	opts?: UseAsyncStateOptions<true, T | null>,
) {
	const {
		state,
		execute: _, // Don't include "execute" in returned object
		...asyncState
	} = useAsyncState<T | null, [], true>(
		() => storage.getItem(key),
		initialValue ?? null,
		opts,
	);

	// Listen for changes
	let unwatch: (() => void) | undefined;
	onMounted(() => {
		unwatch = storage.watch<T>(key, async (newValue) => {
			state.value = newValue ?? initialValue ?? null;
		});
	});
	onUnmounted(() => {
		unwatch?.();
	});

	return {
		// Use a writable computed ref to write updates to storage
		state: computed({
			get() {
				return state.value;
			},
			set(newValue) {
				void storage.setItem(key, newValue);
				state.value = newValue;
			},
		}),
		...asyncState,
	};
}
