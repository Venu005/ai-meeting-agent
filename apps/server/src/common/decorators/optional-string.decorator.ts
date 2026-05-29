import { Transform } from 'class-transformer';

export const OptionalString = () => Transform(({ value }) => (value === '' ? undefined : value));
