import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Ip,
    Post,
    Res,
    UnauthorizedException,
    UseGuards,
    UsePipes,
} from '@nestjs/common';
import { LoginInputDto } from './dto/input/loginInput.dto';
import { AuthService } from '../application/auth.service';
import { Response } from 'express';
import { RegistrationConfirmationCodeDto } from './dto/input/registrationConfirmationCode.dto';
import { RegistrationEmailResendingDto } from './dto/input/registrationEmailResending.dto';
import { PasswordRecoveryInputDto } from './dto/input/passwordRecoveryInput.dto';
import { NewPasswordRecoveryInputDto } from './dto/input/newPasswordRecoveryInput.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUserId } from './decorators/current-user.param.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { InterlayerNotice } from '../../../../base/models/interlayer';
import { NewPasswordPipe } from '../../../../common/pipes/new-password.pipe';
import { UserInputDto } from '../../../users/api/dto/input/user-input.dto';
import { SkipThrottle } from '@nestjs/throttler';
import { ThrottlerBehindProxyGuard } from '../guards/throttle-behind-proxy.guard';
import { Cookies } from '../../../../common/decorators/get-cookie.decorator';
import { DeviceService } from '../../devices/application/device.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenPayloadDto } from '../../../../common/dto/refresh-token-payload.dto';
import { RefreshTokensCommand, RefreshTokensUseCaseResultType } from '../application/usecases/refresh-tokens.usecase';
import { UsersQueryRepository } from '../../../users/infrastructure/users-query.repository';

@UseGuards(ThrottlerBehindProxyGuard)
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersQueryRepository: UsersQueryRepository,
        private readonly commandBus: CommandBus,
        private readonly deviceService: DeviceService,
        private readonly jwtService: JwtService,
    ) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async authUser(
        @Body() authBody: LoginInputDto,
        @Ip() ip: string,
        @Headers('user-agent') deviceName: string,
        @CurrentUserId() userId: string,
        @Res({ passthrough: true }) res: Response,
    ) {

        const loginInterlayer = await this.authService.loginUser(deviceName, ip, userId);

        if (loginInterlayer.hasError()) throw new UnauthorizedException()
        res.cookie('refreshToken', loginInterlayer.data.refreshToken, { httpOnly: true, secure: true });
        return {accessToken: loginInterlayer.data.accessToken};
    }

    @Post('password-recovery')
    @HttpCode(HttpStatus.NO_CONTENT)
    async passwordRecovery(
        @Body() passwordRecoveryInputBody: PasswordRecoveryInputDto,
    ) {
        await this.authService.passwordRecovery(passwordRecoveryInputBody);
    }

    @Post('new-password')
    @UsePipes(NewPasswordPipe)
    @HttpCode(HttpStatus.NO_CONTENT)
    async newPassword(@Body() newPasswordBody: NewPasswordRecoveryInputDto) {
        await this.authService.setNewPassword(newPasswordBody);
    }

    @Post('registration')
    @HttpCode(HttpStatus.NO_CONTENT)
    async registrationUser(@Body() userBody: UserInputDto) {
        await this.authService.registrationUser(userBody);
    }

    @Post('registration-confirmation')
    async registrationConfirmation(
        @Body() confirmationCode: RegistrationConfirmationCodeDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const isConfirmed =
            await this.authService.confirmationCode(confirmationCode);
        isConfirmed
            ? res.status(HttpStatus.NO_CONTENT)
            : res.status(HttpStatus.NOT_FOUND);
    }

    @Post('registration-email-resending')
    @HttpCode(HttpStatus.NO_CONTENT)
    async resendConfirmationCode(
        @Body() registrationEmailResendingBody: RegistrationEmailResendingDto,
    ) {
        await this.authService.resendCode(registrationEmailResendingBody);
    }

    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getCurrentUser(
        // @Headers('authorization')  accessToken: string
        @CurrentUserId() currentUserId: string,
    ) {
        const user = await this.usersQueryRepository.findMe(currentUserId)
        if (!user) throw new UnauthorizedException()
        return user
    }

    @SkipThrottle()
    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    async updatePairOfTokens(
        //todo переписать внутрь @Cookies засунуть pipe с доставанием токен payload и проверкой expired девайса (132-144 строчки)
        @Cookies('refreshToken') refreshToken: string,
        @Res({ passthrough: true }) res: Response,
    ) {

        let refreshTokenPayload: RefreshTokenPayloadDto;
        try {
            refreshTokenPayload = this.jwtService.verify(refreshToken);
        } catch {
            throw new UnauthorizedException();
        }
        if (!refreshTokenPayload) throw new UnauthorizedException();

        const checkingInterlayer = await this.deviceService.checkDeviceExpiration(
            refreshTokenPayload.deviceId,
            refreshTokenPayload.iat
        )
        if (checkingInterlayer.hasError()) throw new UnauthorizedException()

        const command = new RefreshTokensCommand(refreshTokenPayload);
        const tokensInterlayer = await this.commandBus.execute<RefreshTokensCommand, InterlayerNotice<RefreshTokensUseCaseResultType>>(command);

        if (tokensInterlayer.hasError()) {
            throw new UnauthorizedException()
        }

        res.cookie('refreshToken', tokensInterlayer.data.refreshToken
            , { httpOnly: true, secure: true });
        return { accessToken: tokensInterlayer.data.accessToken };
    }

    @SkipThrottle()
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        //todo переписать внутрь @Cookies засунуть pipe с доставанием токен payload и проверкой expired девайса
        @Cookies('refreshToken') refreshToken: string,
    ) {
        let refreshTokenPayload;
        try {
            refreshTokenPayload = this.jwtService.verify(refreshToken);
        } catch {
            throw new UnauthorizedException();
        }

        const checkingInterlayer = await this.deviceService.checkDeviceExpiration(
            refreshTokenPayload.deviceId,
            refreshTokenPayload.iat
        )
        if (checkingInterlayer.hasError()) throw new UnauthorizedException()

        const deviceInterLayer = await this.deviceService.setDeviceExpired(refreshTokenPayload.deviceId);

        if (deviceInterLayer.hasError()) throw new UnauthorizedException();
    }
}