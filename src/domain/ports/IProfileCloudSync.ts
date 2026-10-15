/**
 * IProfileCloudSync - The one thing the time feature needs from an account's cloud store: push the
 * birth date and expected age so a person's other devices see them. Declared here so time does not
 * depend on the account feature; the account's cloud store satisfies it structurally.
 */

export interface IProfileCloudSync {
  upsertProfile(
    uid: string,
    profile: { birthDate: string; deathAge: number },
  ): Promise<void>;
}
