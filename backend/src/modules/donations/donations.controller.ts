import { Body, Controller, Get, Ip, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/public.decorator';
import { CheckoutDto } from './donations.schemas';
import { DonationsService } from './donations.service';

@ApiTags('donations')
@Public()
@Controller('donations')
export class DonationsController {
  constructor(private readonly donations: DonationsService) {}

  /** 201 { url }: the browser goes to the provider's payment page. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('checkout')
  checkout(@Body() body: CheckoutDto, @Ip() ip: string) {
    return this.donations.checkout(body, ip);
  }

  /** Status shown on /donate/thank-you (PENDING until the provider confirms). */
  @Get('sessions/:sessionId')
  status(@Param('sessionId') sessionId: string) {
    return this.donations.status(sessionId);
  }
}
