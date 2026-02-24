import { nip19 } from "nostr-tools";
import {
	finalizeEvent,
	generateSecretKey,
	getPublicKey,
} from "nostr-tools/pure";

export type NostrKeys = {
	secretKey: Uint8Array;
	publicKeyHex: string;
	nsec: string;
	npub: string;
};

export type ProfileInput = {
	name: string;
	about?: string;
	picture?: string;
};

export function createKeys(): NostrKeys {
	const secretKey = generateSecretKey();
	const publicKeyHex = getPublicKey(secretKey);

	return {
		secretKey,
		publicKeyHex,
		nsec: nip19.nsecEncode(secretKey),
		npub: nip19.npubEncode(publicKeyHex),
	};
}

export function keysFromNsec(nsec: string): NostrKeys | null {
	const secretKey = secretKeyFromNsec(nsec);
	if (!secretKey) {
		return null;
	}

	const publicKeyHex = getPublicKey(secretKey);

	return {
		secretKey,
		publicKeyHex,
		nsec,
		npub: nip19.npubEncode(publicKeyHex),
	};
}

export function createProfileEvent(input: {
	keys: NostrKeys;
	profile: ProfileInput;
}) {
	const content = JSON.stringify({
		name: input.profile.name,
		display_name: input.profile.name,
		about: input.profile.about ?? "",
		picture: input.profile.picture ?? "",
	});

	return finalizeEvent(
		{
			kind: 0,
			created_at: Math.floor(Date.now() / 1000),
			tags: [],
			content,
		},
		input.keys.secretKey,
	);
}

export function createFollowEvent(input: {
	keys: NostrKeys;
	pubkeysToFollow: string[];
}) {
	return finalizeEvent(
		{
			kind: 3,
			created_at: Math.floor(Date.now() / 1000),
			tags: input.pubkeysToFollow.map((pubkey) => ["p", pubkey]),
			content: "",
		},
		input.keys.secretKey,
	);
}

export function secretKeyFromNsec(nsec: string): Uint8Array | null {
	try {
		const decoded = nip19.decode(nsec);
		if (decoded.type !== "nsec") {
			return null;
		}

		return decoded.data;
	} catch {
		return null;
	}
}
