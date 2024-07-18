import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class userInput implements PipeTransform {
    transform(value: string, metadata: ArgumentMetadata) {
        const num = Number(value);

        if (isNaN(num)) {
            throw new BadRequestException('Not a number');
        }

        return num;
    }
}