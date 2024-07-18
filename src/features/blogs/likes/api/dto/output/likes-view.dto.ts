export enum LikeStatus {
    None= 'None',
    Like = 'Like',
    Dislike = 'Dislike'
}

export type LikeDetailsViewDto = {
    description: string,
    addedAt: string,
    userId: string,
    login: string
}