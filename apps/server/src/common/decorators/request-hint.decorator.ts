import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestHint } from '@repo/shared-types/types';

export const RequestHints = createParamDecorator((data: unknown, ctx: ExecutionContext): RequestHint => {
  const request = ctx.switchToHttp().getRequest();
  const latitudeHeader = (request.headers['x-latitude'] || request.headers['X-Latitude']) as string;
  const longitudeHeader = (request.headers['x-longitude'] || request.headers['X-Longitude']) as string;

  const requestHints = {
    city: (request.headers['x-city'] as string) || undefined,
    state: (request.headers['x-state'] as string) || undefined,
    country: (request.headers['x-country'] as string) || undefined,
    timezone: (request.headers['x-timezone'] as string) || undefined,
    latitude: latitudeHeader && latitudeHeader.trim() !== '' ? parseFloat(latitudeHeader) : undefined,
    longitude: longitudeHeader && longitudeHeader.trim() !== '' ? parseFloat(longitudeHeader) : undefined,
  };

  return requestHints;
});
