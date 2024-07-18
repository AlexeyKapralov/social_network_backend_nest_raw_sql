import bcrypt from 'bcrypt'

export class CryptoService {
    async createPasswordHash(password: string, salt?: string) {
        if (salt === undefined) {
            salt = bcrypt.genSaltSync(10)
        }
        return await bcrypt.hash(password, salt)
    }

    async comparePasswordsHash(reqPassPlainText: string, dbPassHash: string): Promise<boolean> {
        return await bcrypt.compare(reqPassPlainText, dbPassHash)
    }

    async getTokenPayload(token: string) {
        return bcrypt.va
    }
}