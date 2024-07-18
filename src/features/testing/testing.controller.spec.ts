import { Test, TestingModule } from '@nestjs/testing';
import { TestingService } from './testing.service';
import { TestingController } from './testing.controller';

describe('AppController', () => {
  let appController: TestingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TestingController],
      providers: [TestingService],
    }).compile();

    appController = app.get<TestingController>(TestingController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
