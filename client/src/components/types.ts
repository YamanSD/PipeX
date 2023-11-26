/**
 * >- audio: if true, the user is not muted.
 * >- avatarColor: avatar color of the user.
 * >- name: name of the user.
 * >- video: if true, the user has their camera open.
 * >- screen: if true, the user is sharing their screen.
 */
export type participant = {
    audio: boolean,
    screen: boolean,
    video: boolean,
    avatarColor: string,
    name: string,
};

/**
 * Generic object type.
 */
export type Generic<T = any> = {[_: string]: T};
