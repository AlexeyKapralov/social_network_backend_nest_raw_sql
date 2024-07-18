import { IsEnum } from 'class-validator';

export type EnvironmentVariable = { [key: string]: string | undefined };

export enum Environments {
    DEVELOPMENT = 'DEVELOPMENT',
    STAGING = 'STAGING',
    // 'production' данная переменная не допустима, так как isProduction будет работать не корректно
    PRODUCTION = 'PRODUCTION',
    TEST = 'TESTING',
}
export class EnvironmentSettings {
    constructor(private environmentVariables: EnvironmentVariable) {}
    @IsEnum(Environments)
    private ENV = this.environmentVariables.ENV;
    get isProduction() {
        return this.environmentVariables.ENV === Environments.PRODUCTION;
    }
    get isStaging() {
        return this.environmentVariables.ENV === Environments.STAGING;
    }
    get isTesting() {
        return this.environmentVariables.ENV === Environments.TEST;
    }
    get isDevelopment() {
        return this.environmentVariables.ENV === Environments.DEVELOPMENT;
    }
    get currentEnv() {
        return this.ENV;
    }
}