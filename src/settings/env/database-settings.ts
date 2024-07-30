import { IsNumber, IsString } from 'class-validator';
import { EnvironmentVariable } from './env-settings';

export class DatabaseSettings {
    constructor(private environmentVariables: EnvironmentVariable) {}
    @IsString()
    MONGO_CONNECTION_URI: string = this.environmentVariables.MONGO_CONNECTION_URI
    @IsString()
    MONGO_CONNECTION_URI_FOR_TESTS: string = this.environmentVariables.MONGO_CONNECTION_URI_FOR_TESTS
    @IsString()
    POSTGRESQL_DBNAME: string = this.environmentVariables.POSTGRESQL_DBNAME
    @IsString()
    POSTGRESQL_TEST_DBNAME: string = this.environmentVariables.POSTGRESQL_DBNAME
}