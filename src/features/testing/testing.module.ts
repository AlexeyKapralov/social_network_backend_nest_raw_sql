import { DynamicModule, Module } from '@nestjs/common';
import { TestingService } from './testing.service';
import { TestingController } from './testing.controller';
import { config } from 'dotenv';

config()

@Module({})
export class TestingModule {
    static register(env): DynamicModule {
        if (process.env.ENV !== 'PRODUCTION') {
            return {
                module: TestingModule,
                imports: [],
                controllers: [TestingController],
                providers: [TestingService],
                exports: [TestingService]
            }
        }

        return {
            module: TestingModule,
            imports: [],
            controllers: [],
            providers: []
        }

    }
}