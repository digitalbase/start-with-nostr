import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	Camera,
	Check,
	Copy,
	ExternalLink,
	Eye,
	EyeOff,
	Shield,
	Sparkles,
	Users,
} from "lucide-react";
import { type Event, nip19 } from "nostr-tools";
import { SimplePool } from "nostr-tools/pool";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import {
	InteractiveStepper,
	InteractiveStepperDescription,
	InteractiveStepperIndicator,
	InteractiveStepperItem,
	InteractiveStepperSeparator,
	InteractiveStepperTitle,
	InteractiveStepperTrigger,
} from "../components/ui/interactive-stepper";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { suggestedFollows } from "../lib/follow-list";
import {
	createFollowEvent,
	createKeys,
	createProfileEvent,
	keysFromNsec,
	type NostrKeys,
} from "../lib/nostr";

export const Route = createFileRoute("/")({ component: App });

const STORAGE_KEY = "nostr-onboarding-v1";
const DEFAULT_RELAY_INPUT = "ws://localhost:10547";

type Screen = "welcome" | "keys" | "profile" | "follow" | "client";

type PersistedState = {
	screen: Screen;
	nsec: string;
	savedKeyConfirmed: boolean;
	displayName: string;
	about: string;
	picture: string;
	selectedPubkeys: string[];
	publishEnabled: boolean;
	relayInput: string;
	profileEventJson: string;
	followEventJson: string;
	profilePublishStatus: string;
	followPublishStatus: string;
};

const clientOptions = [
	{
		name: "Primal",
		description: "Polished feed, profile discovery, and media support.",
		url: "https://primal.net/home",
	},
	{
		name: "Snort",
		description: "Fast web client focused on power users and extensions.",
		url: "https://snort.social/",
	},
	{
		name: "Iris",
		description: "Simple web-first Nostr client with clean onboarding.",
		url: "https://iris.to/",
	},
] as const;

function parseRelayUrls(input: string): string[] {
	return input
		.split(/[\n,\s]+/)
		.map((url) => url.trim())
		.filter((url) => url.length > 0);
}

function screenToStep(screen: Screen): number {
	if (screen === "keys") return 1;
	if (screen === "profile") return 2;
	if (screen === "follow") return 3;
	if (screen === "client") return 4;
	return 1;
}

function stepToScreen(step: number): Screen {
	if (step === 1) return "keys";
	if (step === 2) return "profile";
	if (step === 3) return "follow";
	return "client";
}

async function publishEventToRelays(
	relays: string[],
	event: Event,
): Promise<string> {
	if (relays.length === 0) {
		return "Publish skipped: add at least one relay URL.";
	}

	const pool = new SimplePool();
	try {
		const results = await Promise.allSettled(pool.publish(relays, event));
		const successCount = results.filter(
			(result) => result.status === "fulfilled",
		).length;
		const failureCount = results.length - successCount;

		if (failureCount === 0) {
			return `Published to ${successCount}/${results.length} relays.`;
		}

		return `Published to ${successCount}/${results.length} relays (${failureCount} failed).`;
	} finally {
		pool.destroy();
	}
}

function App() {
	const [hasHydrated, setHasHydrated] = useState(false);
	const [screen, setScreen] = useState<Screen>("welcome");
	const [keys, setKeys] = useState<NostrKeys | null>(null);
	const [savedKeyConfirmed, setSavedKeyConfirmed] = useState(false);
	const [showPrivateKey, setShowPrivateKey] = useState(false);

	const [displayName, setDisplayName] = useState("");
	const [about, setAbout] = useState("");
	const [picture, setPicture] = useState("");
	const [profileEventJson, setProfileEventJson] = useState("");
	const [followEventJson, setFollowEventJson] = useState("");

	const [publishEnabled, setPublishEnabled] = useState(true);
	const [relayInput, setRelayInput] = useState(DEFAULT_RELAY_INPUT);
	const [profilePublishStatus, setProfilePublishStatus] = useState("");
	const [followPublishStatus, setFollowPublishStatus] = useState("");

	const [selectedPubkeys, setSelectedPubkeys] = useState<string[]>(
		suggestedFollows.slice(0, 3).map((person) => person.pubkey),
	);

	const relayUrls = useMemo(() => parseRelayUrls(relayInput), [relayInput]);

	const followCards = useMemo(() => {
		return suggestedFollows.map((person) => ({
			...person,
			npub: nip19.npubEncode(person.pubkey),
		}));
	}, []);

	useEffect(() => {
		const storedValue = localStorage.getItem(STORAGE_KEY);
		if (!storedValue) {
			setHasHydrated(true);
			return;
		}

		try {
			const parsed = JSON.parse(storedValue) as PersistedState;
			if (parsed.nsec) {
				const restoredKeys = keysFromNsec(parsed.nsec);
				if (restoredKeys) {
					setKeys(restoredKeys);
				}
			}

			setScreen(parsed.screen);
			setSavedKeyConfirmed(parsed.savedKeyConfirmed);
			setDisplayName(parsed.displayName);
			setAbout(parsed.about);
			setPicture(parsed.picture);
			setSelectedPubkeys(parsed.selectedPubkeys);
			setPublishEnabled(parsed.publishEnabled);
			setRelayInput(parsed.relayInput);
			setProfileEventJson(parsed.profileEventJson);
			setFollowEventJson(parsed.followEventJson);
			setProfilePublishStatus(parsed.profilePublishStatus);
			setFollowPublishStatus(parsed.followPublishStatus);
		} catch {
			localStorage.removeItem(STORAGE_KEY);
		} finally {
			setHasHydrated(true);
		}
	}, []);

	useEffect(() => {
		if (!hasHydrated) {
			return;
		}

		const value: PersistedState = {
			screen,
			nsec: keys?.nsec ?? "",
			savedKeyConfirmed,
			displayName,
			about,
			picture,
			selectedPubkeys,
			publishEnabled,
			relayInput,
			profileEventJson,
			followEventJson,
			profilePublishStatus,
			followPublishStatus,
		};

		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	}, [
		hasHydrated,
		screen,
		keys,
		savedKeyConfirmed,
		displayName,
		about,
		picture,
		selectedPubkeys,
		publishEnabled,
		relayInput,
		profileEventJson,
		followEventJson,
		profilePublishStatus,
		followPublishStatus,
	]);

	function resetOnboarding() {
		setScreen("welcome");
		setKeys(null);
		setSavedKeyConfirmed(false);
		setShowPrivateKey(false);
		setDisplayName("");
		setAbout("");
		setPicture("");
		setProfileEventJson("");
		setFollowEventJson("");
		setProfilePublishStatus("");
		setFollowPublishStatus("");
		setSelectedPubkeys(
			suggestedFollows.slice(0, 3).map((person) => person.pubkey),
		);
		localStorage.removeItem(STORAGE_KEY);
	}

	function handleCreateAccount() {
		const generated = createKeys();
		setKeys(generated);
		setSavedKeyConfirmed(false);
		setProfileEventJson("");
		setFollowEventJson("");
		setProfilePublishStatus("");
		setFollowPublishStatus("");
		setScreen("keys");
	}

	async function handleCreateProfile() {
		if (!keys || !displayName.trim()) {
			return;
		}

		const profileEvent = createProfileEvent({
			keys,
			profile: {
				name: displayName.trim(),
				about: about.trim(),
				picture: picture.trim(),
			},
		});

		setProfileEventJson(JSON.stringify(profileEvent, null, 2));

		if (publishEnabled) {
			const status = await publishEventToRelays(relayUrls, profileEvent);
			setProfilePublishStatus(status);
		} else {
			setProfilePublishStatus("Signed locally only (publishing disabled).");
		}

		setScreen("follow");
	}

	async function handleFinishFollows() {
		if (!keys) {
			return;
		}

		const followEvent = createFollowEvent({
			keys,
			pubkeysToFollow: selectedPubkeys,
		});

		setFollowEventJson(JSON.stringify(followEvent, null, 2));

		if (publishEnabled) {
			const status = await publishEventToRelays(relayUrls, followEvent);
			setFollowPublishStatus(status);
		} else {
			setFollowPublishStatus("Signed locally only (publishing disabled).");
		}

		setScreen("client");
	}

	function toggleFollow(pubkey: string) {
		setSelectedPubkeys((current) => {
			if (current.includes(pubkey)) {
				return current.filter((candidate) => candidate !== pubkey);
			}

			return [...current, pubkey];
		});
	}

	if (!hasHydrated) {
		return (
			<main className="onboarding-shell flex min-h-screen items-center justify-center px-6">
				<p className="font-mono text-sm text-fuchsia-200">
					Loading onboarding state...
				</p>
			</main>
		);
	}

	if (screen === "welcome") {
		return (
			<main className="onboarding-shell">
				<div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
					<div className="mx-auto max-w-3xl text-center">
						<p className="font-mono text-sm text-fuchsia-300">
							START WITH NOSTR
						</p>
						<h1 className="mt-3 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-violet-400 bg-clip-text text-6xl font-extrabold leading-tight text-transparent md:text-8xl">
							NOSTR
						</h1>
						<p className="mt-8 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
							Own your voice.
						</p>
						<p className="mt-2 text-4xl font-bold tracking-tight text-fuchsia-300 md:text-6xl">
							Join Nostr.
						</p>
						<p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
							A social network where you control your data, your identity, and
							your connections. No algorithms. No ads. No censorship.
						</p>

						<Button className="mt-10" size="lg" onClick={handleCreateAccount}>
							Create Your Account <ArrowRight className="ml-1 size-5" />
						</Button>

						<p className="mt-4 text-sm text-muted-foreground">
							Takes about 2 minutes
						</p>
					</div>

					<div className="mt-16 grid gap-4 md:grid-cols-3">
						{[
							{
								icon: Shield,
								title: "You own your identity",
								text: "Only your keys unlock your account.",
							},
							{
								icon: Users,
								title: "Works everywhere",
								text: "Your profile and follows are portable.",
							},
							{
								icon: Sparkles,
								title: "Censorship resistant",
								text: "No single company controls your social graph.",
							},
						].map((feature) => (
							<Card key={feature.title} className="border-white/10 bg-black/25">
								<CardHeader>
									<feature.icon className="size-7 text-fuchsia-300" />
									<CardTitle>{feature.title}</CardTitle>
									<CardDescription>{feature.text}</CardDescription>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="onboarding-shell min-h-screen px-6 py-8">
			<div className="mx-auto w-full max-w-3xl pb-20">
				<div className="mb-14">
					<InteractiveStepper
						value={screenToStep(screen)}
						onStepChange={(step) => setScreen(stepToScreen(step))}
						orientation="horizontal"
					>
						<InteractiveStepperItem>
							<InteractiveStepperTrigger>
								<div className="flex items-start">
									<InteractiveStepperIndicator />
									<div className="ml-3">
										<InteractiveStepperTitle>Save keys</InteractiveStepperTitle>
										<InteractiveStepperDescription>
											Step 1 of 4
										</InteractiveStepperDescription>
									</div>
								</div>
							</InteractiveStepperTrigger>
							<InteractiveStepperSeparator />
						</InteractiveStepperItem>
						<InteractiveStepperItem>
							<InteractiveStepperTrigger>
								<div className="flex items-start">
									<InteractiveStepperIndicator />
									<div className="ml-3">
										<InteractiveStepperTitle>Profile</InteractiveStepperTitle>
										<InteractiveStepperDescription>
											Step 2 of 4
										</InteractiveStepperDescription>
									</div>
								</div>
							</InteractiveStepperTrigger>
							<InteractiveStepperSeparator />
						</InteractiveStepperItem>
						<InteractiveStepperItem>
							<InteractiveStepperTrigger>
								<div className="flex items-start">
									<InteractiveStepperIndicator />
									<div className="ml-3">
										<InteractiveStepperTitle>Follow</InteractiveStepperTitle>
										<InteractiveStepperDescription>
											Step 3 of 4
										</InteractiveStepperDescription>
									</div>
								</div>
							</InteractiveStepperTrigger>
							<InteractiveStepperSeparator />
						</InteractiveStepperItem>
						<InteractiveStepperItem>
							<InteractiveStepperTrigger>
								<div className="flex items-start">
									<InteractiveStepperIndicator />
									<div className="ml-3">
										<InteractiveStepperTitle>Client</InteractiveStepperTitle>
										<InteractiveStepperDescription>
											Step 4 of 4
										</InteractiveStepperDescription>
									</div>
								</div>
							</InteractiveStepperTrigger>
						</InteractiveStepperItem>
					</InteractiveStepper>
				</div>

				{screen === "keys" && keys ? (
					<div className="space-y-7">
						<div className="text-center">
							<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-3xl bg-fuchsia-500/20">
								<Shield className="size-12 text-fuchsia-300" />
							</div>
							<h2 className="text-5xl font-bold tracking-tight">
								Your Keys Are Ready
							</h2>
							<p className="mt-4 text-xl text-muted-foreground">
								Saved in localStorage so you can resume on this browser.
							</p>
						</div>

						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Public Key (npub)</CardTitle>
									<Badge>Share freely</Badge>
								</div>
								<CardDescription>This is your Nostr username.</CardDescription>
							</CardHeader>
							<CardContent className="flex gap-3">
								<Input
									readOnly
									value={keys.npub}
									className="font-mono text-sm"
								/>
								<Button
									variant="secondary"
									size="icon"
									onClick={() => navigator.clipboard.writeText(keys.npub)}
									aria-label="Copy public key"
								>
									<Copy className="size-4" />
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Private Key (nsec)</CardTitle>
									<Badge className="border-amber-500/40 bg-amber-500/20 text-amber-200">
										Never share
									</Badge>
								</div>
								<CardDescription>
									Anyone with this can control your account.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex gap-3">
								<Input
									readOnly
									value={showPrivateKey ? keys.nsec : "*".repeat(44)}
									className="font-mono text-sm"
								/>
								<Button
									variant="secondary"
									size="icon"
									onClick={() => setShowPrivateKey((current) => !current)}
									aria-label="Toggle private key"
								>
									{showPrivateKey ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</Button>
								<Button
									variant="secondary"
									size="icon"
									onClick={() => navigator.clipboard.writeText(keys.nsec)}
									aria-label="Copy private key"
								>
									<Copy className="size-4" />
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="flex items-start gap-3 pt-6">
								<Checkbox
									checked={savedKeyConfirmed}
									onChange={(event) =>
										setSavedKeyConfirmed(event.currentTarget.checked)
									}
								/>
								<div>
									<p className="text-xl font-semibold">
										I have saved my private key somewhere safe
									</p>
									<p className="mt-2 text-muted-foreground">
										Write it down, save it in a password manager, or secure it
										offline.
									</p>
								</div>
							</CardContent>
						</Card>

						<Button
							size="lg"
							className="w-full"
							disabled={!savedKeyConfirmed}
							onClick={() => setScreen("profile")}
						>
							Continue to Profile Setup <ArrowRight className="size-5" />
						</Button>
					</div>
				) : null}

				{screen === "profile" ? (
					<div className="space-y-7">
						<div className="text-center">
							<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-3xl bg-fuchsia-500/20">
								<Sparkles className="size-12 text-fuchsia-300" />
							</div>
							<h2 className="text-5xl font-bold tracking-tight">
								Create Your Profile
							</h2>
							<p className="mt-4 text-xl text-muted-foreground">
								Let people know who you are. You can always change this later.
							</p>
						</div>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Relay Publishing</CardTitle>
								<CardDescription>
									Configurable publishing for local relay testing.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-3">
									<Checkbox
										checked={publishEnabled}
										onChange={(event) =>
											setPublishEnabled(event.currentTarget.checked)
										}
									/>
									<p className="text-sm font-medium">
										Publish signed events to relays
									</p>
								</div>
								<div>
									<Label>Relay URLs (comma/newline separated)</Label>
									<Textarea
										value={relayInput}
										onChange={(event) =>
											setRelayInput(event.currentTarget.value)
										}
										className="mt-2 min-h-20 font-mono text-xs"
										placeholder="ws://localhost:10547"
									/>
									<p className="mt-2 text-xs text-muted-foreground">
										Active relays: {relayUrls.length}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="space-y-5 pt-6">
								<div className="flex justify-center">
									<div className="flex size-40 flex-col items-center justify-center rounded-full border border-white/10 bg-black/35 text-muted-foreground">
										<Camera className="mb-2 size-9" />
										<span>Add photo URL</span>
									</div>
								</div>

								<div>
									<Label>Display Name *</Label>
									<Input
										value={displayName}
										onChange={(event) =>
											setDisplayName(event.currentTarget.value)
										}
										placeholder="How should people call you?"
										className="mt-2"
									/>
								</div>

								<div>
									<Label>Photo URL (optional)</Label>
									<Input
										value={picture}
										onChange={(event) => setPicture(event.currentTarget.value)}
										placeholder="https://example.com/avatar.png"
										className="mt-2"
									/>
								</div>

								<div>
									<Label>About You (optional)</Label>
									<Textarea
										value={about}
										onChange={(event) => setAbout(event.currentTarget.value)}
										placeholder="Tell people a bit about yourself..."
										className="mt-2"
									/>
								</div>
							</CardContent>
						</Card>

						{profilePublishStatus ? (
							<p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-muted-foreground">
								{profilePublishStatus}
							</p>
						) : null}

						<div className="space-y-3">
							<Button
								size="lg"
								className="w-full"
								onClick={() => {
									void handleCreateProfile();
								}}
								disabled={!displayName.trim()}
							>
								Create Profile <ArrowRight className="size-5" />
							</Button>
							<button
								type="button"
								onClick={() => setScreen("follow")}
								className="w-full text-center text-muted-foreground hover:text-foreground"
							>
								Skip for now
							</button>
						</div>
					</div>
				) : null}

				{screen === "follow" ? (
					<div className="space-y-6">
						<div className="text-center">
							<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-3xl bg-fuchsia-500/20">
								<Users className="size-12 text-fuchsia-300" />
							</div>
							<h2 className="text-5xl font-bold tracking-tight">
								Follow Great People
							</h2>
							<p className="mt-4 text-xl text-muted-foreground">
								Pick a few profiles to make your feed useful from day one.
							</p>
						</div>

						{profilePublishStatus ? (
							<p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-muted-foreground">
								Profile event: {profilePublishStatus}
							</p>
						) : null}

						<div className="grid gap-4">
							{followCards.map((person) => {
								const checked = selectedPubkeys.includes(person.pubkey);

								return (
									<Card key={person.pubkey}>
										<CardContent className="flex items-start justify-between gap-4 pt-6">
											<div>
												<p className="text-lg font-semibold">{person.name}</p>
												<p className="text-sm text-muted-foreground">
													{person.handle}
												</p>
												<p className="mt-2 text-sm text-muted-foreground">
													{person.about}
												</p>
												<p className="mt-2 font-mono text-xs text-fuchsia-200">
													{person.npub}
												</p>
											</div>
											<Button
												variant={checked ? "default" : "secondary"}
												onClick={() => toggleFollow(person.pubkey)}
											>
												{checked ? (
													<>
														<Check className="size-4" /> Following
													</>
												) : (
													"Follow"
												)}
											</Button>
										</CardContent>
									</Card>
								);
							})}
						</div>

						{followPublishStatus ? (
							<p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-muted-foreground">
								Follow event: {followPublishStatus}
							</p>
						) : null}

						<Button
							size="lg"
							className="w-full"
							onClick={() => {
								void handleFinishFollows();
							}}
						>
							Continue to Clients ({selectedPubkeys.length} selected)
						</Button>
					</div>
				) : null}

				{screen === "client" ? (
					<div className="space-y-6">
						<div className="text-center">
							<div className="mx-auto mb-5 flex size-24 items-center justify-center rounded-3xl bg-fuchsia-500/20">
								<Sparkles className="size-12 text-fuchsia-300" />
							</div>
							<h2 className="text-5xl font-bold tracking-tight">
								Pick a Client
							</h2>
							<p className="mt-4 text-xl text-muted-foreground">
								Your account is ready. Open a client and login with your `nsec`.
							</p>
						</div>

						{keys ? (
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">
										Your account details
									</CardTitle>
									<CardDescription>
										Use `nsec` to login. Keep it private.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<p className="text-xs text-muted-foreground">npub</p>
										<p className="font-mono text-xs text-fuchsia-200">
											{keys.npub}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">nsec</p>
										<p className="font-mono text-xs">
											{showPrivateKey ? keys.nsec : "*".repeat(44)}
										</p>
									</div>
									<div className="flex gap-3">
										<Button
											variant="secondary"
											onClick={() => setShowPrivateKey((current) => !current)}
										>
											{showPrivateKey ? "Hide nsec" : "Show nsec"}
										</Button>
										<Button
											variant="secondary"
											onClick={() => navigator.clipboard.writeText(keys.nsec)}
										>
											<Copy className="size-4" /> Copy nsec
										</Button>
									</div>
								</CardContent>
							</Card>
						) : null}

						<div className="grid gap-4 md:grid-cols-3">
							{clientOptions.map((client) => (
								<Card key={client.name} className="h-full">
									<CardHeader>
										<CardTitle>{client.name}</CardTitle>
										<CardDescription>{client.description}</CardDescription>
									</CardHeader>
									<CardContent>
										<Button
											className="w-full"
											onClick={() =>
												window.open(client.url, "_blank", "noopener,noreferrer")
											}
										>
											Open {client.name} <ExternalLink className="size-4" />
										</Button>
									</CardContent>
								</Card>
							))}
						</div>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Signed events</CardTitle>
								<CardDescription>
									These are the exact events generated with nostr-tools.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{profileEventJson ? (
									<div>
										<p className="text-sm text-muted-foreground">
											Profile event (kind 0)
										</p>
										<pre className="mt-2 max-h-52 overflow-auto rounded-lg bg-black/40 p-4 font-mono text-xs text-fuchsia-100">
											{profileEventJson}
										</pre>
									</div>
								) : null}
								{followEventJson ? (
									<div>
										<p className="text-sm text-muted-foreground">
											Follow event (kind 3)
										</p>
										<pre className="mt-2 max-h-52 overflow-auto rounded-lg bg-black/40 p-4 font-mono text-xs text-fuchsia-100">
											{followEventJson}
										</pre>
									</div>
								) : null}
							</CardContent>
						</Card>

						<Button size="lg" className="w-full" onClick={resetOnboarding}>
							Start again
						</Button>
					</div>
				) : null}
			</div>
		</main>
	);
}
