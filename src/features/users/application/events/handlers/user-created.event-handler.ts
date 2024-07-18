import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserCreatedEvent } from '../user-created.event';

// https://docs.nestjs.com/recipes/cqrs#queries
@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler
    implements IEventHandler<UserCreatedEvent>
{
    constructor() {}

    handle(event: UserCreatedEvent) {
        // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
        // необходимо обрабатывать вручную
        try {
            // do logic
            console.log(
                `UserCreatedEventHandler / User with name: ${event.login} successful created`,
            );
        } catch (e) {
            console.error(e);
        }
    }
}