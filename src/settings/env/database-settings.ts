import { IsNumber, IsString } from 'class-validator';
import { EnvironmentVariable } from './env-settings';

export class DatabaseSettings {
    constructor(private environmentVariables: EnvironmentVariable) {}
    @IsString()
    MONGO_CONNECTION_URI: string = this.environmentVariables.MONGO_CONNECTION_URI
    @IsString()
    MONGO_CONNECTION_URI_FOR_TESTS: string = this.environmentVariables.MONGO_CONNECTION_URI_FOR_TESTS
}