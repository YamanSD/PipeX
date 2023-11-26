/**
 * Type alias for the user JSON object stored in
 * the local storage.
 *
 * >- currentRoom?: ID of the current room the user is in.
 * >- token: current token of the user.
 * >- uid: ID of the current user.
 */
export type User = {
    currentRoom?: string,
    token: string,
    uid: string,
    isConnected: boolean,
}

/* key used to retrieve and store user data */
const UserKey: string = "UserInfo";

/**
 * @param user new user data to be saved.
 */
export function setUser(user: User): void {
    sessionStorage.setItem(UserKey, JSON.stringify(user));
}

/**
 * @returns current user's data if present.
 *          Otherwise, null.
 */
export function getUser(): User | null {
    const stringData: string | null = sessionStorage.getItem(UserKey);

    /* check if there is any data */
    if (stringData === null) {
        return null;
    }

    return JSON.parse(stringData) as User;
}

/**
 * Clears the current user data.
 */
export function clear(): void {
    sessionStorage.removeItem(UserKey);
}
