import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { applyAppSettings } from '../../src/settings/apply-app-settings';
import { aDescribe } from '../utils/aDescribe';
import { skipSettings } from '../utils/skip-settings';
import { UserManagerTest } from '../utils/userManager.test';
import { UsersRepository } from '../../src/features/users/infrastructure/users.repository';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { PostManagerTest } from '../utils/postManager.test';
import { BlogInputDto } from '../../src/features/blogs/blogs/api/dto/input/blog-input.dto';
import { BlogsManagerTest } from '../utils/blogsManager.test';
import { BlogsRepository } from '../../src/features/blogs/blogs/infrastructure/blogs.repository';
import { PostInputDto } from '../../src/features/blogs/posts/api/dto/input/post-input.dto';
import { AuthManagerTest } from '../utils/authManager.test';
import { UserViewDto } from '../../src/features/users/api/dto/output/user-view.dto';
import { LikeManagerTest } from '../utils/likeManager.test';
import { LikeStatus } from '../../src/features/blogs/likes/api/dto/output/likes-view.dto';
import { PostsViewDto } from '../../src/features/blogs/posts/api/dto/output/extended-likes-info-view.dto';
import { agent as request } from 'supertest';
import { HttpStatus } from '@nestjs/common';

aDescribe(skipSettings.for('postsTests'))('PostsController (e2e)', () => {
    let app: NestExpressApplication;
    let userManagerTest: UserManagerTest;
    let postManagerTest: PostManagerTest;
    let blogManagerTest: BlogsManagerTest;
    let authManagerTest: AuthManagerTest;
    let likeManagerTest: LikeManagerTest;
    let blogsRepository: BlogsRepository;
    let usersRepository: UsersRepository;

    beforeAll(async () => {
        // можно создать глобальный state
        // expect.setState([
        //     // adminTokens: loginResult
        // ]);

        //получение глобальных переменных
        // expect.getState();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            // .overrideProvider(UsersService) // для мока (передаем класс который хотим переопределить)
            // .useClass(UserSeviceMock) // моковый класс
            // useFactory используется если нужно передававть какие-то данные внутрь, если данные передававть не надо, то используется UseClass
            // .useFactory({
            //         factory: (usersRepo: UsersRepository) => {
            //             return new UserServiceMock(usersRepo, {
            //                 count: 50
            //             } )
            //         },
            //          inject: [UsersQueryRepository, UsersRepository] //последовательность важна
            //     })
            .compile();

        usersRepository = moduleFixture.get<UsersRepository>(UsersRepository);
        blogsRepository = moduleFixture.get<BlogsRepository>(BlogsRepository);

        app = moduleFixture.createNestApplication();

        // await NestFactory.create<NestExpressApplication>(AppModule);

        applyAppSettings(app);

        await app.init();

        const dataSource = app.get<DataSource>(DataSource);
        await dataSource.query(`
            TRUNCATE 
                public.users,
                public.posts, 
                public.blogs,
                public.comments,
                public.devices, 
                public.likes`,
        );
        // await dataSource.dropDatabase()

        // const configService = app.get(ConfigService)
        // const apiSettings = configService.get<ApiSettings>('apiSettings')
        // console.log(apiSettings.ACCESS_TOKEN_EXPIRATION_LIVE)
        // console.log(apiSettings.REFRESH_TOKEN_EXPIRATION_LIVE)

        //подключение менеджера
        userManagerTest = new UserManagerTest(app);
        postManagerTest = new PostManagerTest(app);
        blogManagerTest = new BlogsManagerTest(app);
        authManagerTest = new AuthManagerTest(app);
        likeManagerTest = new LikeManagerTest(app)
    });

    afterAll(async () => {
        await app.close();
    });

    it('should create users', async () => {
        // const userBody = {
        //     login: 'qS-9oRnN-',
        //     password: 'string',
        //     email: 'example@example.com',
        // };
        //
        // expect.setState({
        //     userBody1: userBody,
        // });

        const users: UserViewDto[] = await userManagerTest.createUsers(4);
        const token1 = await authManagerTest.login({ loginOrEmail: users[0].email, password: 'password0' });
        const token2 = await authManagerTest.login({ loginOrEmail: users[1].email, password: 'password1' });
        const token3 = await authManagerTest.login({ loginOrEmail: users[2].email, password: 'password2' });
        const token4 = await authManagerTest.login({ loginOrEmail: users[3].email, password: 'password3' });

        const blogBody: BlogInputDto = {
            'name': 'new blog',
            'websiteUrl': 'https://someurl.com',
            'description': 'description',
        };
        const blog = await blogManagerTest.createBlog(blogBody);


        let posts: PostsViewDto[] = []
        for (let i = 0; i < 6; i++) {
            const postBody: PostInputDto = {
                blogId: blog.id,
                title: 'string' + i,
                shortDescription: '1length_101-DnZlTI1khUHpqOqCzftIYiSHCzW9V5K8cqY3aPKo3XKwbfrmeWOJyQgGnlX5sP3aW3RlaRSQx' + i,
                content: 'string'+ i
            };
            const post = await postManagerTest.createPost(postBody, token1.accessToken);
            posts.push(post)
        }

        await likeManagerTest.likeOrDislikePost(token1.accessToken, {likeStatus: LikeStatus.Like}, posts[0].id)
        await likeManagerTest.likeOrDislikePost(token1.accessToken, {likeStatus: LikeStatus.Like}, posts[2].id)
        await likeManagerTest.likeOrDislikePost(token1.accessToken, {likeStatus: LikeStatus.Like}, posts[3].id)
        await likeManagerTest.likeOrDislikePost(token1.accessToken, {likeStatus: LikeStatus.Like}, posts[5].id)
        await likeManagerTest.likeOrDislikePost(token1.accessToken, {likeStatus: LikeStatus.Dislike}, posts[2].id)

        await likeManagerTest.likeOrDislikePost(token2.accessToken, {likeStatus: LikeStatus.Like}, posts[0].id)
        await likeManagerTest.likeOrDislikePost(token2.accessToken, {likeStatus: LikeStatus.Like}, posts[1].id)
        await likeManagerTest.likeOrDislikePost(token2.accessToken, {likeStatus: LikeStatus.Like}, posts[3].id)
        await likeManagerTest.likeOrDislikePost(token2.accessToken, {likeStatus: LikeStatus.Like}, posts[4].id)
        await likeManagerTest.likeOrDislikePost(token2.accessToken, {likeStatus: LikeStatus.Dislike}, posts[1].id)

        await likeManagerTest.likeOrDislikePost(token3.accessToken, {likeStatus: LikeStatus.Like}, posts[1].id)
        await likeManagerTest.likeOrDislikePost(token3.accessToken, {likeStatus: LikeStatus.Like}, posts[3].id)
        await likeManagerTest.likeOrDislikePost(token3.accessToken, {likeStatus: LikeStatus.Dislike}, posts[4].id)
        await likeManagerTest.likeOrDislikePost(token3.accessToken, {likeStatus: LikeStatus.Dislike}, posts[1].id)

        await likeManagerTest.likeOrDislikePost(token4.accessToken, {likeStatus: LikeStatus.Like}, posts[3].id)

        const postsFinal =  await request(app.getHttpServer())
            .get(`/posts`)
            .set({authorization: `Bearer ${token1.accessToken}`})
            .expect(HttpStatus.OK)

        expect(postsFinal.body).toEqual({
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 6,
            items: [
                {
                    "id": expect.any(String),
                    "title": expect.any(String),
                    "shortDescription": expect.any(String),
                    "content": expect.any(String),
                    "blogId": blog.id,
                    "blogName": blog.name,
                    'createdAt': expect.stringMatching(
                        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                    ),
                    "extendedLikesInfo": {
                        "likesCount": 1,
                        "dislikesCount": 0,
                        "myStatus": "Like",
                        "newestLikes": [
                            {
                                "addedAt": expect.stringMatching(
                                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                                ),
                                "userId": expect.any(String),
                                "login": "login0"
                            }
                        ]
                    }
                },
                {
                    "id": expect.any(String),
                    "title": expect.any(String),
                    "shortDescription": expect.any(String),
                    "content": expect.any(String),
                    "blogId": blog.id,
                    "blogName": blog.name,
                    'createdAt': expect.stringMatching(
                        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                    ),
                    "extendedLikesInfo": {
                        "likesCount": 1,
                        "dislikesCount": 1,
                        "myStatus": "None",
                        "newestLikes": [
                            {
                                "addedAt": expect.stringMatching(
                                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                                ),
                                "userId": expect.any(String),
                                "login": "login1"
                            }
                        ]
                    }
                },
                {
                    "id": expect.any(String),
                    "title": expect.any(String),
                    "shortDescription": expect.any(String),
                    "content": expect.any(String),
                    "blogId": blog.id,
                    "blogName": blog.name,
                    'createdAt': expect.stringMatching(
                        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                    ),
                    "extendedLikesInfo": {
                        "likesCount": 4,
                        "dislikesCount": 0,
                        "myStatus": "Like",
                        "newestLikes": [
                            {
                                "addedAt": expect.stringMatching(
                                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                                ),
                                "userId": expect.any(String),
                                "login": "login3"
                            },
                            {
                                "addedAt": expect.stringMatching(
                                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                                ),
                                "userId": expect.any(String),
                                "login": "login2"
                            },
                            {
                                "addedAt": expect.stringMatching(
                                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                                ),
                                "userId": expect.any(String),
                                "login": "login1"
                            }
                        ]
                    }
                },
                {
                    "id": expect.any(String),
                    "title": expect.any(String),
                    "shortDescription": expect.any(String),
                    "content": expect.any(String),
                    "blogId": blog.id,
                    "blogName": blog.name,
                    'createdAt': expect.stringMatching(
                        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                    ),
                    "extendedLikesInfo": {
                        "likesCount": 0,
                        "dislikesCount": 1,
                        "myStatus": "Dislike",
                        "newestLikes": []
                    }
                },
                {
                    "id": expect.any(String),
                    "title": expect.any(String),
                    "shortDescription": expect.any(String),
                    "content": expect.any(String),
                    "blogId": blog.id,
                    "blogName": blog.name,
                    'createdAt': expect.stringMatching(
                        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                    ),
                    "extendedLikesInfo": {
                        "likesCount": 0,
                        "dislikesCount": 2,
                        "myStatus": "None",
                        "newestLikes": []
                    }
                },
                {
                    "id": expect.any(String),
                    "title": expect.any(String),
                    "shortDescription": expect.any(String),
                    "content": expect.any(String),
                    "blogId": blog.id,
                    "blogName": blog.name,
                    'createdAt': expect.stringMatching(
                        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                    ),
                    "extendedLikesInfo": {
                        "likesCount": 2,
                        "dislikesCount": 0,
                        "myStatus": "Like",
                        "newestLikes": [
                            {
                                "addedAt": expect.stringMatching(
                                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                                ),
                                "userId": expect.any(String),
                                "login": "login1"
                            },
                            {
                                "addedAt": expect.stringMatching(
                                    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
                                ),
                                "userId": expect.any(String),
                                "login": "login0"
                            }
                        ]
                    }
                }
            ]
        });
    });

});
